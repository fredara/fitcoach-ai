import { config } from '../config/env';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string;
  images?: string[];
}

export interface UserContext {
  displayName?: string;
  sportFocus?: string[];
  fitnessLevel?: string;
  weightKg?: number;
  heightCm?: number;
  targetPace?: string;
  activePlan?: any;
  recentSessionsText?: string;
}

function buildSystemPrompt(userContext?: UserContext): string {
  const name = userContext?.displayName || 'Freddy';
  const level = userContext?.fitnessLevel || 'intermedio';

  return `Eres Coach AI (FitCoach), un entrenador de élite y fisiólogo deportivo de alto rendimiento con metodología híbrida estilo Runna + Strava Pro.
Estás entrenando a ${name} (Nivel: ${level}).

${userContext?.recentSessionsText ? `📊 HISTORIAL REAL DE ENTRENAMIENTOS DEL ATLETA:
${userContext.recentSessionsText}
(Tienes pleno conocimiento de estas sesiones: ritmos, distancias, pulsaciones y sensaciones. Úsalas para analizar su progresión, responder preguntas y ajustar recomendaciones).` : ''}

🎯 OBJETIVO PRINCIPAL DEL ATLETA:
- Progresar y alcanzar el ritmo de carrera (Pace) de **4:30 min/km** (4'30'' /km) de forma consistente y sostenible.
- Maximizar su VO2 Máx, eficiencia cardiovascular y reciclaje de lactato.
- Plan periodizado en ciclos estrictos de **6 SEMANAS**.

📋 ESTRUCTURA DE ENTRENAMIENTOS POR BLOQUES:
Cada sesión debe desglosarse en bloques claros y específicos:
1. **Objetivo**: Fisiológico o neuromuscular (ej: "Estimular el sistema neuromuscular para correr rápido y procesar más oxígeno").
2. **Calentamiento**: (ej: "10 minutos de trote muy suave a Zona 2, 115-133 ppm").
3. **Bloque Principal**: (ej: "8 repeticiones de 200 metros a ritmo entre 5'00\" y 5'25\"/km" o "35 a 45 min continuos a 8'00\"-8'30\"/km" o "3 series de 5 min tempo a 7'00\"-7'15\"/km" o "Tirada larga 6 km a 8:15-8:30/km").
4. **Recuperación**: (ej: "1 minuto de caminata activa (<115 ppm) para limpiar lactato" o "2 min de caminata").
5. **Enfriamiento / Vuelta a la Calma**: (ej: "3 a 5 minutos de caminata suave a Zona 2").
6. **Enfoque Técnico / Cadencia / Regla de Oro**: (ej: "Cadencia ~160 spm, pasos cortos y prohibido acelerar en rodajes Z2").
7. **Pauta de Nutrición e Hidratación**: (ej: "500ml agua con sales minerales 30 min antes").

🧠 REGLAS FUNDAMENTALES:
1. **ADAPTACIÓN DEL PLAN DESDE EL CHAT (SIEMPRE EMITIR BLOQUE :::PLAN_UPDATE)**:
   - Si el usuario te pide ajustar, crear, modificar o cambiar el plan o sus 4 días de entrenamiento, DEBES confirmar con criterio técnico y agregar SIEMPRE al final de tu mensaje el bloque:
   :::PLAN_UPDATE
   {
     "week_number": 1,
     "days": [
       {
         "day_name": "Día 1: Martes",
         "sport": "running",
         "title": "Intervalos Cortos (VO₂ max & Velocidad)",
         "objective": "Estimular el sistema neuromuscular para correr rápido y obligar al corazón a procesar más oxígeno.",
         "warmup": "10 minutos de trote muy suave para elevar la temperatura corporal (Zona 2, 115-133 ppm).",
         "main_block": "8 repeticiones de 200 metros a ritmo exigente (entre 5'00\" y 5'25\"/km).",
         "recovery": "1 minuto de caminata activa (<115 ppm).",
         "cooldown": "3 a 5 minutos de caminata suave a Zona 2.",
         "target_pace": "5'00\" - 5'25\" /km (en series)",
         "target_hr_zone": "Zona 4-5 en series / Zona 2 calentamiento",
         "nutrition_tip": "500ml agua con electrolitos 20 min antes."
       },
       {
         "day_name": "Día 2: Jueves",
         "sport": "running",
         "title": "Carrera Base (Desarrollo Aeróbico)",
         "objective": "Desarrollar red capilar y quemar grasa en zona segura.",
         "main_block": "35 a 45 minutos continuos de trote.",
         "technical_focus": "Cadencia ~160 spm y pasos cortos.",
         "target_pace": "8'00\" - 8'30\" /km (Conversacional)",
         "target_hr_zone": "Zona 2 (115-133 ppm)",
         "nutrition_tip": "Hidratación adecuada previa."
       },
       {
         "day_name": "Día 3: Sábado",
         "sport": "running",
         "title": "Ritmo Umbral (Tempo Controlado)",
         "objective": "Acostumbrar las piernas a sostener ritmo ágil reciclando ácido láctico.",
         "warmup": "10 minutos de trote suave.",
         "main_block": "3 series de 5 minutos a ritmo sostenido (entre 7'00\" y 7'15\"/km).",
         "recovery": "2 minutos de caminata obligatoria.",
         "cooldown": "3 a 5 minutos de caminata.",
         "target_pace": "7'00\" - 7'15\" /km",
         "target_hr_zone": "Zona 3-4",
         "nutrition_tip": "Desayuno ligero 90 min antes."
       },
       {
         "day_name": "Día 4: Domingo",
         "sport": "running",
         "title": "Tirada Larga (Resistencia Pura)",
         "objective": "Sumar volumen y tiempo sobre los pies para hipertrofia cardíaca.",
         "main_block": "6 kilómetros continuos.",
         "technical_focus": "Regla de Oro: Prohibido acelerar, mantener cadencia fluida.",
         "target_pace": "8'15\" - 8'30\" /km",
         "target_hr_zone": "Zona 2 estricta (115-133 ppm)",
         "nutrition_tip": "300ml agua con sales cada 20 min."
       }
     ]
   }
   :::

2. **EXTRACCIÓN AUTOMÁTICA DE ENTRENAMIENTOS A HISTORIAL**:
   - Si el usuario comparte datos de un entrenamiento realizado, extrae los datos con:
   :::SESSION_RECORD
   {
     "sport_type": "running",
     "title": "Nombre de la sesión",
     "distance_meters": 5000,
     "duration_seconds": 2100,
     "avg_pace_sec_per_km": 315,
     "avg_heart_rate": 154,
     "max_heart_rate": 178,
     "calories_burned": 420,
     "feedback": "Diagnóstico en 1 línea"
   }
   :::

3. **GESTIÓN DE AMBIGÜEDAD**:
   - Si faltan datos en un mensaje o foto, pregunta directamente antes de inventar.`;
}

function extractDelimitedJson(text: string, delimiter: string): { cleanText: string; data: any } {
  if (!text.includes(delimiter)) {
    return { cleanText: text, data: null };
  }

  try {
    const parts = text.split(delimiter);
    const before = parts[0].trim();
    const afterPart = parts[1];
    const rawBlock = afterPart.split(':::')[0].trim();
    const rest = afterPart.split(':::')[1] || '';

    // Limpiar posibles bloques markdown ```json ... ```
    let jsonStr = rawBlock;
    if (jsonStr.includes('```')) {
      const match = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      }
    }

    // Extraer solo la porción JSON válida entre { ... }
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(jsonStr);
    const combinedText = (before + (rest.trim() ? '\n\n' + rest.trim() : '')).trim();
    return { cleanText: combinedText, data: parsed };
  } catch (err) {
    console.warn(`Error parsing delimiter ${delimiter}:`, err);
    return { cleanText: text, data: null };
  }
}

export async function generateChatResponse(
  history: ChatMessage[],
  userContext?: UserContext
): Promise<{ text: string; extractedSession?: any; planUpdate?: any }> {
  if (!config.aiApiKey) {
    throw new Error('API Key de IA no configurada en el servidor.');
  }

  const systemPrompt = buildSystemPrompt(userContext);

  const formattedMessages: any[] = [
    { role: 'system', content: systemPrompt }
  ];

  const recentHistory = history.slice(-10);

  for (const msg of recentHistory) {
    const allImages = msg.images || (msg.image ? [msg.image] : []);
    if (allImages.length > 0) {
      formattedMessages.push({
        role: msg.role,
        content: [
          { type: 'text', text: msg.content || 'Por favor analiza los datos deportivos de las imágenes adjuntas.' },
          ...allImages.map(imgUrl => ({ type: 'image_url', image_url: { url: imgUrl } }))
        ]
      });
    } else {
      formattedMessages.push({
        role: msg.role,
        content: msg.content
      });
    }
  }

  const response = await fetch(config.aiBaseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.aiModel,
      messages: formattedMessages,
      max_tokens: 2048,
      temperature: 0.5,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error en API de IA:', response.status, errorText);
    let parsedMessage = errorText;
    try {
      const errObj = JSON.parse(errorText);
      parsedMessage = errObj.error?.message || errObj.message || errorText;
    } catch {}
    throw new Error(`Error en servicio de IA (${response.status}): ${parsedMessage}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0]?.message;
  let rawOutput = choice?.content || choice?.reasoning_content || 'No pude generar una respuesta en este momento.';

  // 1. Extraer :::SESSION_RECORD
  const sessionRes = extractDelimitedJson(rawOutput, ':::SESSION_RECORD');
  let cleanText = sessionRes.cleanText;
  const extractedSession = sessionRes.data;

  // 2. Extraer :::PLAN_UPDATE
  const planRes = extractDelimitedJson(cleanText, ':::PLAN_UPDATE');
  cleanText = planRes.cleanText;
  const planUpdate = planRes.data;

  console.log('🤖 Fireworks Chat Result -> Extracted Session:', !!extractedSession, '| Plan Update:', !!planUpdate);

  return { text: cleanText, extractedSession, planUpdate };
}

export async function generateTrainingPlan(
  userContext: UserContext,
  targetGoal: string = '5K a 4:30 min/km',
  weeksCount: number = 6,
  daysPerWeek: number = 4
): Promise<any> {
  const prompt = `Genera un Plan de Entrenamiento Deportivo Profesional estructurado de ${weeksCount} semanas (${daysPerWeek} días por semana) enfocado en:
- OBJETIVO: ${targetGoal}
- ATLETA: ${userContext.displayName || 'Atleta'}, Nivel: ${userContext.fitnessLevel || 'intermedio'}
- MACROCICLO: Estrictamente de 6 SEMANAS divididas en 4 fases periodizadas.
- METODOLOGÍA: Bloques estructurados (Objetivo, Calentamiento, Bloque Principal, Recuperación, Enfriamiento, Enfoque Técnico, Ritmo Meta, Zona FC, Nutrición).

Devuelve EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura:
{
  "title": "Ciclo de 6 Semanas hacia 4:30/km & VO2max",
  "goal": "${targetGoal}",
  "weeks_count": 6,
  "days_per_week": ${daysPerWeek},
  "target_pace_sec": 270,
  "phases": [
    { "phase": 1, "name": "Adaptación Neuromuscular & Base Z2", "weeks": "Semanas 1-2" },
    { "phase": 2, "name": "Desarrollo de Umbral de Lactato & Series", "weeks": "Semanas 3-4" },
    { "phase": 3, "name": "Potencia de Carrera hacia 4:30/km", "weeks": "Semana 5" },
    { "phase": 4, "name": "Tapering y Test Oficial Sub 4:30", "weeks": "Semana 6" }
  ],
  "weeks": [
    {
      "week_number": 1,
      "focus": "Estimulación neuromuscular, base en Zona 2 y control de lactato",
      "completed": false,
      "days": [
        {
          "day_name": "Día 1: Martes",
          "sport": "running",
          "title": "Intervalos Cortos (VO₂ max & Velocidad)",
          "objective": "Estimular el sistema neuromuscular para correr rápido y obligar al corazón a procesar más oxígeno.",
          "warmup": "10 minutos de trote muy suave (Zona 2, 115-133 ppm).",
          "main_block": "8 repeticiones de 200m a ritmo entre 5'00\" y 5'25\"/km.",
          "recovery": "1 minuto de caminata activa entre repeticiones (<115 ppm).",
          "cooldown": "3 a 5 minutos de caminata suave a Zona 2.",
          "target_pace": "5'00\" - 5'25\" /km",
          "target_hr_zone": "Zona 4-5 en series",
          "nutrition_tip": "500ml agua con electrolitos 30 min antes."
        }
      ]
    }
  ]
}`;

  const response = await fetch(config.aiBaseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.aiModel,
      messages: [
        { role: 'system', content: 'Eres un generador experto de planes de entrenamiento de 6 semanas para atletismo. Responde ÚNICAMENTE en formato JSON estricto.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 3500,
    }),
  });

  if (!response.ok) {
    throw new Error('No se pudo generar el plan con IA.');
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '{}';
  
  let jsonStr = raw.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
  }

  return JSON.parse(jsonStr);
}

export async function analyzeTrainingSession(sessionData: any, userContext?: UserContext): Promise<any> {
  const athleteName = userContext?.displayName || 'Atleta';
  const prompt = `Analiza la siguiente sesión de entrenamiento realizada por ${athleteName} (Nivel: ${userContext?.fitnessLevel || 'intermedio'}), quien busca bajar su ritmo de carrera a 4:30 min/km:
${JSON.stringify(sessionData, null, 2)}

Devuelve EXCLUSIVAMENTE un JSON con:
{
  "summary": "Resumen técnico en 2 líneas de cómo fue la sesión",
  "intensity_score": 8,
  "aerobic_efficiency": "Alta" | "Media" | "Baja",
  "key_takeaways": ["Punto clave 1", "Punto clave 2"],
  "recommendations": ["Recomendación de ritmo/técnica", "Pauta nutricional post-esfuerzo"],
  "recovery_time_hours": 24
}`;

  const response = await fetch(config.aiBaseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.aiModel,
      messages: [
        { role: 'system', content: 'Eres un analista fisiológico deportivo de élite. Responde ÚNICAMENTE en formato JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error('Error analizando sesión.');
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '{}';
  let jsonStr = raw.trim();
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
  else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();

  return JSON.parse(jsonStr);
}

export const analyzeWorkout = analyzeTrainingSession;

export interface ParseWorkoutInput {
  text?: string;
  images?: string[];
  date?: string;
  defaultTitle?: string;
  userContext?: UserContext;
}

export async function parseAndLogWorkout(input: ParseWorkoutInput): Promise<any> {
  const athleteName = input.userContext?.displayName || 'Atleta';
  const promptText = `Eres Coach AI, un entrenador de élite y fisiólogo deportivo.
Analiza la siguiente información de un entrenamiento realizado por ${athleteName} (vía texto en lenguaje natural o imágenes de reloj/app deportiva como Huawei Health, Strava o Garmin):

${input.text ? `DESCRIPCIÓN DEL ATLETA: "${input.text}"` : ''}
${input.defaultTitle ? `TÍTULO SUGERIDO / DÍA DEL PLAN: "${input.defaultTitle}"` : ''}
${input.date ? `FECHA INDICADA: "${input.date}"` : ''}

Extrae con máxima precisión las métricas reales y redacta un análisis técnico breve con:
- Pros: 2-3 puntos fuertes del entrenamiento.
- Improvements: 1-2 puntos a mejorar (técnica, pacing, zonas de pulso o descanso).
- Summary: Resumen conciso de 2 líneas.

Devuelve ÚNICAMENTE un JSON válido con esta estructura:
{
  "sport_type": "running",
  "title": "Nombre descriptivo de la sesión",
  "description": "Detalle técnico de lo realizado",
  "started_at": "YYYY-MM-DDTHH:mm:ssZ",
  "duration_seconds": 2100,
  "distance_meters": 4500,
  "avg_pace_sec_per_km": 310,
  "avg_heart_rate": 154,
  "max_heart_rate": 178,
  "calories_burned": 420,
  "ai_analysis": {
    "summary": "Resumen técnico de 2 líneas",
    "pros": ["Punto a favor 1", "Punto a favor 2"],
    "improvements": ["Aspecto a mejorar o corregir 1"],
    "aerobic_efficiency": "Alta",
    "recommendations": ["Recomendación técnica y pauta nutricional"]
  }
}`;

  const contentArray: any[] = [{ type: 'text', text: promptText }];
  if (input.images && input.images.length > 0) {
    for (const img of input.images) {
      contentArray.push({ type: 'image_url', image_url: { url: img } });
    }
  }

  const response = await fetch(config.aiBaseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.aiModel,
      messages: [
        { role: 'system', content: 'Eres un fisiólogo y analista deportivo de élite. Responde ÚNICAMENTE en JSON válido.' },
        { role: 'user', content: contentArray }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error('Error procesando entrenamiento con IA.');
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '{}';
  let jsonStr = raw.trim();
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
  else if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();

  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(jsonStr);
}

