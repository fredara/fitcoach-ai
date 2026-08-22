import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { generateChatResponse, generateTrainingPlan, analyzeWorkout, parseAndLogWorkout, ChatMessage, UserContext } from '../services/fireworks';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// Chat con el Coach Deportivo (con auto-guardado de sesiones y actualización de plan)
router.post('/chat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messages, message, image, images } = req.body;
    const userId = req.user.id;

    // Obtener perfil del usuario para personalizar
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // Obtener los últimos 8 entrenamientos reales del usuario para darle todo el contexto al Coach IA
    const { data: sessions } = await supabaseAdmin
      .from('training_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(8);

    let recentSessionsText = '';
    if (sessions && sessions.length > 0) {
      recentSessionsText = sessions.map((s: any, idx: number) => {
        const dateFormatted = new Date(s.started_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        const distKm = s.distance_meters ? `${(s.distance_meters / 1000).toFixed(2)} km` : 'N/A';
        const durMin = s.duration_seconds ? `${Math.round(s.duration_seconds / 60)} min` : 'N/A';
        let paceStr = 'N/A';
        if (s.avg_pace_sec_per_km) {
          const m = Math.floor(s.avg_pace_sec_per_km / 60);
          const sc = Math.round(s.avg_pace_sec_per_km % 60);
          paceStr = `${m}:${sc < 10 ? '0' : ''}${sc} /km`;
        }
        const hrStr = s.avg_heart_rate ? `${s.avg_heart_rate} bpm (Pico: ${s.max_heart_rate || '-'})` : 'Sin FC';
        return `${idx + 1}. [${dateFormatted}] "${s.title}" (${s.sport_type}) -> Distancia: ${distKm} | Tiempo: ${durMin} | Ritmo: ${paceStr} | FC: ${hrStr} | Detalle: ${s.description || 'Sin notas'}`;
      }).join('\n');
    }

    const userContext: UserContext = {
      displayName: profile?.display_name || req.user.user_metadata?.full_name || 'Freddy',
      sportFocus: profile?.sport_focus || ['running', 'football'],
      fitnessLevel: profile?.fitness_level || 'intermedio',
      weightKg: profile?.weight_kg,
      heightCm: profile?.height_cm,
      targetPace: '4:30 min/km',
      recentSessionsText,
    };

    let chatHistory: ChatMessage[] = [];
    if (Array.isArray(messages)) {
      chatHistory = messages;
    } else if (message || image || images) {
      const allImages = images || (image ? [image] : []);
      chatHistory = [{ role: 'user', content: message || '', images: allImages }];
    }

    if (chatHistory.length === 0) {
      return res.status(400).json({ error: 'Debes enviar al menos un mensaje o imagen.' });
    }

    const latestUserMessage = chatHistory[chatHistory.length - 1];

    // Guardar mensaje del usuario en la base de datos
    if (latestUserMessage && latestUserMessage.role === 'user') {
      const allImgs = latestUserMessage.images || (latestUserMessage.image ? [latestUserMessage.image] : []);
      await supabaseAdmin.from('chat_messages').insert({
        user_id: userId,
        role: 'user',
        content: latestUserMessage.content,
        metadata: allImgs.length > 0 ? { images: allImgs, image_url: allImgs[0] } : null,
      });
    }

    // Generar respuesta con Fireworks AI (Qwen 3.7 Plus con Visión)
    const { text, extractedSession, planUpdate } = await generateChatResponse(chatHistory, userContext);

    let savedSessionRecord: any = null;

    // Si la IA extrajo un entrenamiento a partir del texto o imágenes, lo guardamos automáticamente en Historial
    if (extractedSession && extractedSession.sport_type) {
      try {
        const { data: savedSession, error: saveErr } = await supabaseAdmin
          .from('training_sessions')
          .insert({
            user_id: userId,
            sport_type: extractedSession.sport_type || 'running',
            title: extractedSession.title || 'Sesión registrada por Coach IA',
            description: extractedSession.feedback || 'Extraído automáticamente desde el chat con IA',
            started_at: new Date().toISOString(),
            duration_seconds: extractedSession.duration_seconds || null,
            distance_meters: extractedSession.distance_meters || null,
            calories_burned: extractedSession.calories_burned || null,
            avg_heart_rate: extractedSession.avg_heart_rate || null,
            max_heart_rate: extractedSession.max_heart_rate || null,
            avg_pace_sec_per_km: extractedSession.avg_pace_sec_per_km || null,
          })
          .select()
          .maybeSingle();

        if (!saveErr && savedSession) {
          savedSessionRecord = savedSession;
        }
      } catch (dbErr) {
        console.warn('No se pudo autoguardar la sesión en Supabase:', dbErr);
      }
    }

    // Guardar respuesta del Coach en la base de datos
    await supabaseAdmin.from('chat_messages').insert({
      user_id: userId,
      role: 'assistant',
      content: text,
      metadata: {
        auto_saved_session_id: savedSessionRecord?.id,
        plan_update: planUpdate,
      },
    });

    return res.json({
      role: 'assistant',
      content: text,
      saved_session: savedSessionRecord,
      plan_update: planUpdate,
    });
  } catch (error: any) {
    console.error('Error en /api/ai/chat:', error);
    return res.status(500).json({
      error: error.message || 'Error al comunicarse con el Coach IA',
    });
  }
});

// Generar o actualizar Plan de Entrenamiento con IA
router.post('/generate-plan', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { targetGoal, weeksCount, daysPerWeek } = req.body;
    const userId = req.user.id;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const userContext: UserContext = {
      displayName: profile?.display_name || req.user.user_metadata?.full_name || 'Freddy',
      fitnessLevel: profile?.fitness_level || 'intermedio',
      sportFocus: profile?.sport_focus || ['running', 'football'],
    };

    const plan = await generateTrainingPlan(
      userContext,
      targetGoal || 'Ritmo 4:30 min/km & VO2max Booster',
      weeksCount || 8,
      daysPerWeek || 4
    );

    return res.json({ plan });
  } catch (error: any) {
    console.error('Error en /api/ai/generate-plan:', error);
    return res.status(500).json({
      error: error.message || 'Error al generar el plan de entrenamiento',
    });
  }
});

// Análisis de Sesión de Entrenamiento
router.post('/analyze', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionData } = req.body;
    const userId = req.user.id;

    if (!sessionData) {
      return res.status(400).json({ error: 'Faltan datos de la sesión para analizar.' });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const userContext: UserContext = {
      displayName: profile?.display_name || req.user.user_metadata?.full_name,
      sportFocus: profile?.sport_focus,
      fitnessLevel: profile?.fitness_level,
    };

    const analysis = await analyzeWorkout(sessionData, userContext);

    if (sessionData.id) {
      await supabaseAdmin
        .from('training_sessions')
        .update({ ai_analysis: analysis })
        .eq('id', sessionData.id)
        .eq('user_id', userId);
    }

    return res.json({ analysis });
  } catch (error: any) {
    console.error('Error en /api/ai/analyze:', error);
    return res.status(500).json({
      error: error.message || 'Error al analizar la sesión con IA',
    });
  }
});

// Registrar y procesar entrenamiento con IA (Lenguaje Natural o Imágenes de Reloj)
router.post('/parse-and-log-session', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { text, images, image, date, defaultTitle } = req.body;
    const userId = req.user.id;

    const allImages = images || (image ? [image] : []);

    if (!text && allImages.length === 0) {
      return res.status(400).json({ error: 'Debes proporcionar una descripción o al menos una imagen de tu reloj/app.' });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const userContext: UserContext = {
      displayName: profile?.display_name || req.user.user_metadata?.full_name || 'Freddy',
      sportFocus: profile?.sport_focus || ['running', 'football'],
      fitnessLevel: profile?.fitness_level || 'intermedio',
      targetPace: '4:30 min/km',
    };

    const parsedWorkout = await parseAndLogWorkout({
      text,
      images: allImages,
      date,
      defaultTitle,
      userContext,
    });

    const sessionDate = parsedWorkout.started_at || date || new Date().toISOString();

    const { data: savedSession, error: saveErr } = await supabaseAdmin
      .from('training_sessions')
      .insert({
        user_id: userId,
        sport_type: parsedWorkout.sport_type || 'running',
        title: parsedWorkout.title || defaultTitle || 'Entrenamiento Registrado',
        description: parsedWorkout.description || text || 'Registrado con Coach IA',
        started_at: sessionDate,
        duration_seconds: parsedWorkout.duration_seconds || null,
        distance_meters: parsedWorkout.distance_meters || null,
        calories_burned: parsedWorkout.calories_burned || null,
        avg_heart_rate: parsedWorkout.avg_heart_rate || null,
        max_heart_rate: parsedWorkout.max_heart_rate || null,
        avg_pace_sec_per_km: parsedWorkout.avg_pace_sec_per_km || null,
        ai_analysis: parsedWorkout.ai_analysis || null,
      })
      .select()
      .maybeSingle();

    if (saveErr) {
      throw saveErr;
    }

    return res.json({
      success: true,
      session: savedSession,
      parsed_data: parsedWorkout,
      analysis: parsedWorkout.ai_analysis,
    });
  } catch (error: any) {
    console.error('Error en /api/ai/parse-and-log-session:', error);
    return res.status(500).json({
      error: error.message || 'Error al registrar el entrenamiento con IA',
    });
  }
});

export default router;
