import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';
import { analyzeWorkout } from '../services/fireworks';

const router = Router();

// Listar sesiones de entrenamiento del usuario
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { data: sessions, error } = await supabaseAdmin
      .from('training_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return res.json({ sessions: sessions || [] });
  } catch (error: any) {
    console.error('Error al obtener sesiones:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener sesiones' });
  }
});

// Guardar nueva sesión de entrenamiento
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const {
      sport_type,
      title,
      description,
      started_at,
      duration_seconds,
      distance_meters,
      calories_burned,
      avg_heart_rate,
      max_heart_rate,
      avg_pace_sec_per_km,
      auto_analyze,
    } = req.body;

    if (!sport_type || !started_at) {
      return res.status(400).json({ error: 'sport_type y started_at son obligatorios' });
    }

    let aiAnalysis = null;
    if (auto_analyze) {
      try {
        aiAnalysis = await analyzeWorkout({
          sport_type,
          title,
          description,
          duration_seconds,
          distance_meters,
          calories_burned,
          avg_heart_rate,
          max_heart_rate,
          avg_pace_sec_per_km,
        });
      } catch (aiErr) {
        console.warn('No se pudo autogenerar el análisis IA:', aiErr);
      }
    }

    const { data: session, error } = await supabaseAdmin
      .from('training_sessions')
      .insert({
        user_id: userId,
        sport_type,
        title: title || `Entrenamiento de ${sport_type}`,
        description,
        started_at,
        duration_seconds,
        distance_meters,
        calories_burned,
        avg_heart_rate,
        max_heart_rate,
        avg_pace_sec_per_km,
        ai_analysis: aiAnalysis,
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ session });
  } catch (error: any) {
    console.error('Error al guardar sesión:', error);
    return res.status(500).json({ error: error.message || 'Error al guardar sesión' });
  }
});

// Obtener detalle de sesión
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: session, error } = await supabaseAdmin
      .from('training_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    return res.json({ session });
  } catch (error: any) {
    console.error('Error al obtener sesión:', error);
    return res.status(500).json({ error: error.message || 'Error al obtener sesión' });
  }
});

// Eliminar sesión
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('training_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return res.json({ success: true, message: 'Sesión eliminada con éxito' });
  } catch (error: any) {
    console.error('Error al eliminar sesión:', error);
    return res.status(500).json({ error: error.message || 'Error al eliminar sesión' });
  }
});

export default router;
