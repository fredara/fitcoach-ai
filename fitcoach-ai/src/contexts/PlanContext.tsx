import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export interface TrainingDay {
  day_name: string;
  sport: 'running' | 'football' | 'gym' | 'rest';
  title: string;
  objective?: string;
  warmup?: string;
  main_block?: string;
  recovery?: string;
  cooldown?: string;
  technical_focus?: string;
  description?: string;
  target_distance_km?: number | string;
  target_duration_min?: number | string;
  target_pace?: string;
  target_hr_zone?: string;
  nutrition_tip?: string;
  completed?: boolean;
}

export interface PlanWeek {
  week_number: number;
  focus: string;
  completed?: boolean;
  days: TrainingDay[];
}

export interface TrainingPlan {
  title: string;
  goal: string;
  target_pace_sec: number;
  weeks_count: number;
  days_per_week: number;
  current_week: number;
  completed_weeks_count: number;
  phases: { phase: number; name: string; weeks: string; icon?: string }[];
  weeks: PlanWeek[];
}

export const INITIAL_6_WEEK_PLAN: TrainingPlan = {
  title: 'Ciclo de 6 Semanas hacia 4:30/km & Resistencia Aeróbica',
  goal: 'Ritmo 4:30 min/km, Optimización de VO2max y Base Aeróbica (Ciclo de 6 Semanas)',
  target_pace_sec: 270,
  weeks_count: 6,
  days_per_week: 4,
  current_week: 1,
  completed_weeks_count: 0,
  phases: [
    { phase: 1, name: 'Adaptación Neuromuscular & Base Z2', weeks: 'Semanas 1-2', icon: '🔋' },
    { phase: 2, name: 'Desarrollo de Umbral de Lactato & Series', weeks: 'Semanas 3-4', icon: '⚡' },
    { phase: 3, name: 'Potencia de Carrera hacia 4:30/km', weeks: 'Semana 5', icon: '🚀' },
    { phase: 4, name: 'Tapering & Test Oficial Sub 4:30', weeks: 'Semana 6', icon: '🏆' },
  ],
  weeks: [
    {
      week_number: 1,
      focus: 'Estimulación neuromuscular, base en Zona 2 y control de lactato',
      completed: false,
      days: [
        {
          day_name: 'Día 1: Martes',
          sport: 'running',
          title: 'Intervalos Cortos (VO₂ max & Velocidad)',
          objective: 'Estimular el sistema neuromuscular para correr rápido y obligar al corazón a procesar más oxígeno, mejorando tu velocidad tope.',
          warmup: '10 minutos de trote muy suave para elevar la temperatura corporal (Zona 2, 115-133 ppm).',
          main_block: '8 repeticiones de 200 metros (0.20 km) a ritmo exigente (entre 5\'00" y 5\'25"/km).',
          recovery: '1 minuto de caminata activa entre cada repetición (<115 ppm). No te detengas por completo; camina a paso firme para limpiar el lactato.',
          cooldown: '3 a 5 minutos de caminata suave a Zona 2. (Recuerda detener el reloj justo al terminar).',
          target_distance_km: '4.5',
          target_duration_min: '35',
          target_pace: '5\'00" - 5\'25" /km (en series)',
          target_hr_zone: 'Zona 4-5 en series / Zona 2 calentamiento',
          technical_focus: 'Frecuencia de zancada alta, zancadas rápidas y contacto de metatarso sin talonear.',
          nutrition_tip: '500 ml de agua con una pizca de sal marina o electrolitos 20 minutos antes.',
          completed: false,
        },
        {
          day_name: 'Día 2: Jueves',
          sport: 'running',
          title: 'Carrera Base (Desarrollo Aeróbico)',
          objective: 'Desarrollar red capilar periférica y acostumbrar al cuerpo a quemar grasa manteniendo pulsaciones controladas.',
          warmup: '5 minutos de movilidad articular de tobillos, rodillas y cadera.',
          main_block: '35 a 45 minutos continuos de trote a ritmo estrictamente conversacional.',
          recovery: 'Sin pausas intermedias.',
          cooldown: '5 minutos de caminata suave y respiración diafragmática profunda.',
          target_distance_km: '5.0',
          target_duration_min: '40',
          target_pace: '8\'00" - 8\'30" /km (Conversacional)',
          target_hr_zone: 'Zona 2 estricta (115 - 133 ppm)',
          technical_focus: 'Cadencia constante (~160 spm), pasos cortos y postura erguida. Si las pulsaciones superan 135 ppm, camina 30 segundos.',
          nutrition_tip: 'Buena hidratación durante el día; comida ligera rica en carbohidratos 2 horas antes.',
          completed: false,
        },
        {
          day_name: 'Día 3: Sábado',
          sport: 'running',
          title: 'Ritmo Umbral (Tempo Controlado)',
          objective: 'Acostumbrar las piernas y la mente a sostener un ritmo ágil reciclando el ácido láctico eficientemente.',
          warmup: '10 minutos de trote suave en Zona 2.',
          main_block: '3 series de 5 minutos a ritmo sostenido (entre 7\'00" y 7\'15"/km).',
          recovery: '2 minutos de caminata obligatoria entre cada bloque de 5 min.',
          cooldown: '3 a 5 minutos de caminata suave para retornar a pulso basal.',
          target_distance_km: '4.5',
          target_duration_min: '38',
          target_pace: '7\'00" - 7\'15" /km (Ritmo Tempo)',
          target_hr_zone: 'Zona 3-4 (135 - 152 ppm)',
          technical_focus: 'Respiración rítmica (2 pasos inhalar, 2 pasos exhalar) y mirada al horizonte.',
          nutrition_tip: 'Desayuno ligero 90 minutos antes (plátano con café o avena).',
          completed: false,
        },
        {
          day_name: 'Día 4: Domingo',
          sport: 'running',
          title: 'Tirada Larga Aeróbica (Fondo & Resistencia)',
          objective: 'Construir resistencia mental y mitocondrial para sostener distancias superiores a 5 km sin fatiga excesiva.',
          warmup: '5 minutos de caminata rápida previa.',
          main_block: '6.0 kilómetros continuos a ritmo muy suave y controlado.',
          recovery: 'Continuo sin paradas obligatorias.',
          cooldown: '5 minutos de caminata y estiramientos suaves de gemelos, isquiotibiales y cuádriceps.',
          target_distance_km: '6.0',
          target_duration_min: '50',
          target_pace: '8\'15" - 8\'35" /km',
          target_hr_zone: 'Zona 2 (118 - 133 ppm)',
          technical_focus: 'Economía de carrera: hombros relajados, brazos en 90° sin cruzar el pecho.',
          nutrition_tip: 'Llevar botella de agua si hace calor; consumir carbohidratos y proteína en los 30 min post-entreno.',
          completed: false,
        },
      ],
    },
    {
      week_number: 2,
      focus: 'Consolidación de volumen y mayor eficiencia en Zona 2',
      completed: false,
      days: [
        {
          day_name: 'Día 1: Martes',
          sport: 'running',
          title: 'Series Cortas de Velocidad (200m)',
          objective: 'Afianzar la zancada rápida y tolerancia a la velocidad.',
          warmup: '10 min trote suave Z2.',
          main_block: '10 repeticiones de 200m a ritmo entre 4\'55" y 5\'20"/km.',
          recovery: '1 min caminata activa entre repeticiones.',
          cooldown: '5 min caminata suave.',
          target_distance_km: '5.0',
          target_duration_min: '40',
          target_pace: '4\'55" - 5\'20" /km',
          target_hr_zone: 'Zona 4-5',
          technical_focus: 'Empuje fuerte de tobillo y brazada compacta.',
          nutrition_tip: 'Electrolitos antes de salir.',
          completed: false,
        },
        {
          day_name: 'Día 2: Jueves',
          sport: 'running',
          title: 'Rodaje Z2 & Fútbol / Movilidad',
          objective: 'Recuperación activa y agilidad de piernas.',
          warmup: '5 min movilidad articular.',
          main_block: '40 min de trote conversacional continuo.',
          recovery: 'Continuo.',
          cooldown: '5 min estiramientos.',
          target_distance_km: '4.8',
          target_duration_min: '40',
          target_pace: '8\'00" - 8\'25" /km',
          target_hr_zone: 'Zona 2 (115-133 ppm)',
          technical_focus: 'Pisar justo debajo del centro de gravedad.',
          nutrition_tip: 'Hidratación abundante durante la jornada.',
          completed: false,
        },
        {
          day_name: 'Día 3: Sábado',
          sport: 'running',
          title: 'Tempo Progresivo',
          objective: 'Aprender a cerrar los entrenamientos más rápido de lo que se inicia.',
          warmup: '10 min trote suave.',
          main_block: '20 min continuos: 10 min a 7\'30"/km + 10 min a 6\'50"/km.',
          recovery: 'Continuo.',
          cooldown: '5 min caminata.',
          target_distance_km: '4.8',
          target_duration_min: '35',
          target_pace: '7\'30" ➔ 6\'50" /km',
          target_hr_zone: 'Zona 3 a Zona 4',
          technical_focus: 'Incrementar cadencia en los últimos 10 minutos.',
          nutrition_tip: 'Un café solo o té verde 30 min antes.',
          completed: false,
        },
        {
          day_name: 'Día 4: Domingo',
          sport: 'running',
          title: 'Tirada Larga de Resistencia (6.5 km)',
          objective: 'Incrementar la capacidad aeróbica máxima.',
          warmup: '5 min caminata.',
          main_block: '6.5 km continuos en Zona 2 pura.',
          recovery: 'Continuo.',
          cooldown: '5 min caminata suave.',
          target_distance_km: '6.5',
          target_duration_min: '55',
          target_pace: '8\'10" - 8\'30" /km',
          target_hr_zone: 'Zona 2 (118-133 ppm)',
          technical_focus: 'Mantener la respiración nasal o conversacional fluida.',
          nutrition_tip: 'Comida rica en carbohidratos complejos la noche anterior.',
          completed: false,
        },
      ],
    },
    {
      week_number: 3,
      focus: 'Transición a series medianas de 400m y control de lactato',
      completed: false,
      days: [
        {
          day_name: 'Día 1: Martes',
          sport: 'running',
          title: 'Series Medianas (400m VO₂ Max)',
          objective: 'Sostener ritmos rápidos durante distancias más largas.',
          warmup: '10 min trote suave.',
          main_block: '6 repeticiones de 400 metros a ritmo de 5\'10" - 5\'30"/km.',
          recovery: '90 segundos de caminata activa.',
          cooldown: '5 min caminata.',
          target_distance_km: '5.2',
          target_duration_min: '42',
          target_pace: '5\'10" - 5\'30" /km',
          target_hr_zone: 'Zona 4',
          technical_focus: 'Ritmo uniforme en cada serie, sin empezar demasiado rápido.',
          nutrition_tip: 'Electrolitos antes de empezar.',
          completed: false,
        },
        {
          day_name: 'Día 2: Jueves',
          sport: 'running',
          title: 'Carrera Base Regenerativa',
          objective: 'Eliminar fatiga residual muscular y vascular.',
          warmup: '5 min movilidad.',
          main_block: '40 min a pulso bajo en Zona 2.',
          recovery: 'Continuo.',
          cooldown: '5 min caminata.',
          target_distance_km: '4.8',
          target_duration_min: '40',
          target_pace: '8\'15" - 8\'40" /km',
          target_hr_zone: 'Zona 2 (<130 ppm)',
          technical_focus: 'Relajación de brazos, cuello y mandíbula.',
          nutrition_tip: 'Hidratación con sales.',
          completed: false,
        },
        {
          day_name: 'Día 3: Sábado',
          sport: 'running',
          title: 'Bloques de Umbral Anaeróbico (3x 1 km)',
          objective: 'Simular sensaciones de carrera exigente.',
          warmup: '10 min trote.',
          main_block: '3 repeticiones de 1000m (1 km) a 6\'30" - 6\'45"/km.',
          recovery: '2 minutos de caminata entre cada km.',
          cooldown: '5 min caminata.',
          target_distance_km: '5.5',
          target_duration_min: '40',
          target_pace: '6\'30" - 6\'45" /km',
          target_hr_zone: 'Zona 4',
          technical_focus: 'Control mental cuando las piernas comiencen a pesar.',
          nutrition_tip: 'Carbohidratos de absorción media 1 hora antes.',
          completed: false,
        },
        {
          day_name: 'Día 4: Domingo',
          sport: 'running',
          title: 'Tirada Larga Aeróbica (7.0 km)',
          objective: 'Desarrollar gran solidez cardiovascular.',
          warmup: '5 min caminata.',
          main_block: '7.0 km continuos a ritmo conversacional.',
          recovery: 'Continuo.',
          cooldown: '5 min caminata y movilidad.',
          target_distance_km: '7.0',
          target_duration_min: '58',
          target_pace: '8\'00" - 8\'25" /km',
          target_hr_zone: 'Zona 2',
          technical_focus: 'Pisar con suavidad para proteger las articulaciones.',
          nutrition_tip: 'Recuperador con proteína y carbohidratos tras finalizar.',
          completed: false,
        },
      ],
    },
    {
      week_number: 4,
      focus: 'Pico de volumen y adaptación específica al ritmo de carrera',
      completed: false,
      days: [
        {
          day_name: 'Día 1: Martes',
          sport: 'running',
          title: 'Pirámide de Velocidad (200m - 400m - 600m - 400m - 200m)',
          objective: 'Desarrollar potencia neuromuscular y cambios de ritmo.',
          warmup: '10 min trote suave.',
          main_block: 'Pirámide: 200m (4:50) - 400m (5:15) - 600m (5:30) - 400m (5:15) - 200m (4:45).',
          recovery: '90 segundos de caminata entre series.',
          cooldown: '5 min caminata.',
          target_distance_km: '5.5',
          target_duration_min: '45',
          target_pace: '4\'45" - 5\'30" /km según tramo',
          target_hr_zone: 'Zona 4-5',
          technical_focus: 'Aceleración progresiva en la última repetición.',
          nutrition_tip: 'Hidratación óptima previa.',
          completed: false,
        },
        {
          day_name: 'Día 2: Jueves',
          sport: 'running',
          title: 'Rodaje Suave Z2',
          objective: 'Asimilar las series y limpiar lactato.',
          warmup: '5 min movilidad.',
          main_block: '40 min continuos en Zona 2.',
          recovery: 'Continuo.',
          cooldown: '5 min caminata.',
          target_distance_km: '4.8',
          target_duration_min: '40',
          target_pace: '8\'10" - 8\'30" /km',
          target_hr_zone: 'Zona 2',
          technical_focus: 'Mantener cadencia cercana a 160 spm.',
          nutrition_tip: 'Abundante agua y sales minerales.',
          completed: false,
        },
        {
          day_name: 'Día 3: Sábado',
          sport: 'running',
          title: 'Tempo Continuo (4 km a Ritmo Vivo)',
          objective: 'Prueba de resistencia a velocidad sostenida.',
          warmup: '10 min trote suave.',
          main_block: '4.0 km continuos a ritmo sostenido entre 6\'15" y 6\'30"/km.',
          recovery: 'Continuo.',
          cooldown: '5 min caminata.',
          target_distance_km: '5.5',
          target_duration_min: '40',
          target_pace: '6\'15" - 6\'30" /km',
          target_hr_zone: 'Zona 4',
          technical_focus: 'Empuje simétrico de ambas piernas.',
          nutrition_tip: 'Comida energética previa.',
          completed: false,
        },
        {
          day_name: 'Día 4: Domingo',
          sport: 'running',
          title: 'Tirada Larga Máxima del Ciclo (7.5 km)',
          objective: 'Mayor volumen aeróbico del macrociclo.',
          warmup: '5 min caminata.',
          main_block: '7.5 km en Zona 2 estricta.',
          recovery: 'Continuo.',
          cooldown: '5 min caminata.',
          target_distance_km: '7.5',
          target_duration_min: '62',
          target_pace: '8\'15" - 8\'35" /km',
          target_hr_zone: 'Zona 2',
          technical_focus: 'Zancada económica sin elevar excesivamente las rodillas.',
          nutrition_tip: 'Desayuno completo 2 horas antes.',
          completed: false,
        },
      ],
    },
    {
      week_number: 5,
      focus: 'Afinación de ritmo objetivo Sub 4:30/km y series rápidas',
      completed: false,
      days: [
        {
          day_name: 'Día 1: Martes',
          sport: 'running',
          title: 'Series Específicas a Ritmo Objetivo (5x 300m a 4:30-4:40)',
          objective: 'Memorizar el ritmo de competición sub 4:30 en las piernas.',
          warmup: '10 min trote suave Z2.',
          main_block: '5 repeticiones de 300m al ritmo objetivo de 4\'30" a 4\'45"/km.',
          recovery: '2 minutos de caminata activa entre cada serie.',
          cooldown: '5 min caminata suave.',
          target_distance_km: '4.8',
          target_duration_min: '38',
          target_pace: '4\'30" - 4\'45" /km',
          target_hr_zone: 'Zona 5',
          technical_focus: 'Frecuencia de zancada alta y máxima reactividad al tocar el suelo.',
          nutrition_tip: 'Electrolitos antes del entrenamiento.',
          completed: false,
        },
        {
          day_name: 'Día 2: Jueves',
          sport: 'running',
          title: 'Rodaje de Mantenimiento Z2',
          objective: 'Mantener las piernas frescas sin generar fatiga.',
          warmup: '5 min movilidad.',
          main_block: '35 min muy suaves en Zona 2.',
          recovery: 'Continuo.',
          cooldown: '5 min caminata.',
          target_distance_km: '4.2',
          target_duration_min: '35',
          target_pace: '8\'15" - 8\'40" /km',
          target_hr_zone: 'Zona 2',
          technical_focus: 'Correr completamente relajado.',
          nutrition_tip: 'Hidratación balanceada.',
          completed: false,
        },
        {
          day_name: 'Día 3: Sábado',
          sport: 'running',
          title: 'Test Progresivo Corto (3 km)',
          objective: 'Medir la facilidad del pulso a ritmos vivos.',
          warmup: '10 min trote suave.',
          main_block: '3 km progresivos: km 1 a 6\'30", km 2 a 5\'45", km 3 a 5\'00"/km.',
          recovery: 'Continuo.',
          cooldown: '5 min caminata.',
          target_distance_km: '4.5',
          target_duration_min: '35',
          target_pace: '6\'30" ➔ 5\'00" /km',
          target_hr_zone: 'Zona 3 a 5',
          technical_focus: 'Acelerar con suavidad sin tirones bruscos.',
          nutrition_tip: 'Snack ligero con carbohidratos simples 45 min antes.',
          completed: false,
        },
        {
          day_name: 'Día 4: Domingo',
          sport: 'running',
          title: 'Fondo de Control (5.5 km)',
          objective: 'Fondo moderado para llegar fresco a la semana de test.',
          warmup: '5 min caminata.',
          main_block: '5.5 km en Zona 2.',
          recovery: 'Continuo.',
          cooldown: '5 min caminata.',
          target_distance_km: '5.5',
          target_duration_min: '45',
          target_pace: '8\'10" - 8\'30" /km',
          target_hr_zone: 'Zona 2',
          technical_focus: 'Postura impecable y respiración profunda.',
          nutrition_tip: 'Comida rica en nutrientes post-entreno.',
          completed: false,
        },
      ],
    },
    {
      week_number: 6,
      focus: 'Tapering, descarga activa y Test Oficial Sub 4:30/km',
      completed: false,
      days: [
        {
          day_name: 'Día 1: Martes',
          sport: 'running',
          title: 'Activación & Progresivos (Descarga)',
          objective: 'Despertar las fibras rápidas sin acumular fatiga.',
          warmup: '10 min trote suave.',
          main_block: '4 progresivos de 100 metros a ritmo vivo (4\'20" - 4\'35"/km) con descanso completo.',
          recovery: '90 segundos de caminata.',
          cooldown: '5 min caminata suave.',
          target_distance_km: '3.5',
          target_duration_min: '25',
          target_pace: '4\'20" - 4\'35" /km en rectas',
          target_hr_zone: 'Zona 4-5',
          technical_focus: 'Zancada elegante, reactiva y potente.',
          nutrition_tip: 'Hidratación completa durante todo el día.',
          completed: false,
        },
        {
          day_name: 'Día 2: Jueves',
          sport: 'running',
          title: 'Trote Suave de Soltura (25 min)',
          objective: 'Eliminar tensión muscular previa al test.',
          warmup: '5 min movilidad.',
          main_block: '20 a 25 min de trote muy regenerativo en Zona 2.',
          recovery: 'Continuo.',
          cooldown: '5 min estiramientos suaves.',
          target_distance_km: '3.0',
          target_duration_min: '25',
          target_pace: '8\'20" - 8\'45" /km',
          target_hr_zone: 'Zona 2 estricta (<125 ppm)',
          technical_focus: 'Sensación de flotar y ligereza en los pies.',
          nutrition_tip: 'Cena con buena carga de carbohidratos complejos.',
          completed: false,
        },
        {
          day_name: 'Día 3: Sábado',
          sport: 'running',
          title: '🏆 Test Oficial: Bajar a 4:30/km',
          objective: '¡Día de consagración! Aplicar todo el ciclo y quebrar la barrera de 4:30 min/km.',
          warmup: '10 min trote suave Z2 + 3 aceleraciones cortas de 50m + movilidad articular.',
          main_block: 'Test de 3 a 5 km a ritmo objetivo sostenido (< 4\'30" /km).',
          recovery: 'Mantener ritmo constante.',
          cooldown: '10 min de caminata lenta de celebración y respiración profunda.',
          target_distance_km: '5.0',
          target_duration_min: '22 - 25',
          target_pace: '4\'20" - 4\'30" /km (Ritmo Objetivo)',
          target_hr_zone: 'Zona 4-5',
          technical_focus: '¡Confianza total en tu preparación! Cadencia alta y mentalidad de acero.',
          nutrition_tip: 'Desayuno ligero 2h antes, 500ml agua con sales y actitud ganadora.',
          completed: false,
        },
        {
          day_name: 'Día 4: Domingo',
          sport: 'running',
          title: 'Caminata Regenerativa & Celebración',
          objective: 'Recuperar el sistema neuromuscular tras el test oficial.',
          warmup: 'Ninguno.',
          main_block: '30 a 45 minutos de caminata relajada en la naturaleza o trote muy suave.',
          recovery: 'Continuo.',
          cooldown: 'Estiramientos completos de tren inferior.',
          target_distance_km: '3.5',
          target_duration_min: '40',
          target_pace: 'Libre (Caminata / Soltura)',
          target_hr_zone: 'Zona 1 (<115 ppm)',
          technical_focus: 'Agradecer a tus piernas y celebrar tu progreso.',
          nutrition_tip: 'Comida completa de celebración con buena proteína y carbohidratos.',
          completed: false,
        },
      ],
    },
  ],
};

interface PlanContextType {
  plan: TrainingPlan;
  setPlan: (newPlan: TrainingPlan) => void;
  updateDay: (weekNumber: number, dayIndex: number, updatedDay: TrainingDay) => void;
  addDay: (weekNumber: number, newDay: TrainingDay) => void;
  deleteDay: (weekNumber: number, dayIndex: number) => void;
  toggleDayCompletion: (weekNumber: number, dayIndex: number) => void;
  toggleWeekCompletion: (weekNumber: number) => void;
  applyPlanUpdateFromAI: (update: any) => void;
  resetToDefaultPlan: () => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlanState] = useState<TrainingPlan>(() => {
    const saved = localStorage.getItem('fitcoach_active_plan_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.weeks_count === 6 && parsed.weeks?.length === 6) {
          return parsed;
        }
      } catch (e) {
        console.error('Error loading saved plan:', e);
      }
    }
    return INITIAL_6_WEEK_PLAN;
  });

  const persistPlan = async (newPlan: TrainingPlan) => {
    localStorage.setItem('fitcoach_active_plan_v2', JSON.stringify(newPlan));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from('training_plans').upsert({
          user_id: session.user.id,
          title: newPlan.title,
          goal: newPlan.goal,
          weeks_count: newPlan.weeks_count || 6,
          days_per_week: newPlan.days_per_week || 4,
          plan_data: newPlan,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
    } catch (e) {
      console.warn('Advertencia guardando plan en Supabase:', e);
    }
  };

  useEffect(() => {
    async function loadCloudPlanAndSessions() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;
        const userId = session.user.id;

        const { data: cloudPlanData, error: planErr } = await supabase
          .from('training_plans')
          .select('plan_data')
          .eq('user_id', userId)
          .maybeSingle();

        let activePlan: TrainingPlan = plan;

        if (!planErr && cloudPlanData?.plan_data?.weeks?.length === 6) {
          activePlan = cloudPlanData.plan_data;
          setPlanState(activePlan);
          localStorage.setItem('fitcoach_active_plan_v2', JSON.stringify(activePlan));
        }

        // 2. Obtener sesiones reales registradas en Supabase (training_sessions)
        const { data: trainingSessions } = await supabase
          .from('training_sessions')
          .select('*')
          .eq('user_id', userId);

        const sessions = trainingSessions || [];

        if (sessions.length > 0) {
          setPlanState(prev => {
            let hasChanges = false;
            const newWeeks = prev.weeks.map(w => {
              const newDays = w.days.map((d, dIdx) => {
                const dayLinkKey = `${w.week_number}_${dIdx}`;
                const isMatched = sessions.some(s => {
                  const raw = s.raw_data || {};
                  const sTitle = (s.title || '').toLowerCase();
                  const dTitle = (d.title || '').toLowerCase();
                  const sDesc = (s.description || '').toLowerCase();
                  
                  const directLink = raw.linked_plan_day === dayLinkKey;
                  const titleMatch = sTitle.includes(dTitle) || dTitle.includes(sTitle) || 
                    sDesc.includes(dTitle) ||
                    (sTitle.includes(`semana ${w.week_number}`) && (
                      (dTitle.includes('intervalo') && sTitle.includes('intervalo')) ||
                      (dTitle.includes('fartlek') && sTitle.includes('fartlek')) ||
                      (dTitle.includes('base') && sTitle.includes('base')) ||
                      (dTitle.includes('umbral') && sTitle.includes('umbral')) ||
                      (dTitle.includes('tempo') && sTitle.includes('tempo')) ||
                      (dTitle.includes('larga') && sTitle.includes('larga')) ||
                      (dTitle.includes('fondo') && sTitle.includes('fondo'))
                    ));

                  return directLink || titleMatch;
                });

                if (isMatched && !d.completed) {
                  hasChanges = true;
                  return { ...d, completed: true };
                }
                return d;
              });

              const allCompleted = newDays.every(d => d.completed);
              return { ...w, days: newDays, completed: allCompleted };
            });

            if (hasChanges) {
              const completedWeeks = newWeeks.filter(w => w.completed).length;
              const syncedPlan = { ...prev, weeks: newWeeks, completed_weeks_count: completedWeeks };
              persistPlan(syncedPlan);
              return syncedPlan;
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn('Nota: Sincronización en la nube del plan:', err);
      }
    }

    loadCloudPlanAndSessions();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadCloudPlanAndSessions();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setPlan = (newPlan: TrainingPlan) => {
    setPlanState(newPlan);
    persistPlan(newPlan);
  };

  const resetToDefaultPlan = () => {
    setPlanState(INITIAL_6_WEEK_PLAN);
    persistPlan(INITIAL_6_WEEK_PLAN);
  };

  const updateDay = (weekNumber: number, dayIndex: number, updatedDay: TrainingDay) => {
    setPlanState(prev => {
      const newWeeks = prev.weeks.map(w => {
        if (w.week_number === weekNumber) {
          const newDays = [...w.days];
          newDays[dayIndex] = updatedDay;
          return { ...w, days: newDays };
        }
        return w;
      });
      const updated = { ...prev, weeks: newWeeks };
      persistPlan(updated);
      return updated;
    });
  };

  const addDay = (weekNumber: number, newDay: TrainingDay) => {
    setPlanState(prev => {
      const newWeeks = prev.weeks.map(w => {
        if (w.week_number === weekNumber) {
          return { ...w, days: [...w.days, newDay] };
        }
        return w;
      });
      const updated = { ...prev, weeks: newWeeks };
      persistPlan(updated);
      return updated;
    });
  };

  const deleteDay = (weekNumber: number, dayIndex: number) => {
    setPlanState(prev => {
      const newWeeks = prev.weeks.map(w => {
        if (w.week_number === weekNumber) {
          const newDays = w.days.filter((_, idx) => idx !== dayIndex);
          return { ...w, days: newDays };
        }
        return w;
      });
      const updated = { ...prev, weeks: newWeeks };
      persistPlan(updated);
      return updated;
    });
  };

  const toggleDayCompletion = (weekNumber: number, dayIndex: number) => {
    setPlanState(prev => {
      const newWeeks = prev.weeks.map(w => {
        if (w.week_number === weekNumber) {
          const newDays = [...w.days];
          newDays[dayIndex] = { ...newDays[dayIndex], completed: !newDays[dayIndex].completed };
          const allCompleted = newDays.every(d => d.completed);
          return { ...w, days: newDays, completed: allCompleted };
        }
        return w;
      });
      const completedWeeks = newWeeks.filter(w => w.completed).length;
      const updated = { ...prev, weeks: newWeeks, completed_weeks_count: completedWeeks };
      persistPlan(updated);
      return updated;
    });
  };

  const toggleWeekCompletion = (weekNumber: number) => {
    setPlanState(prev => {
      const newWeeks = prev.weeks.map(w => {
        if (w.week_number === weekNumber) {
          const newStatus = !w.completed;
          const newDays = w.days.map(d => ({ ...d, completed: newStatus }));
          return { ...w, completed: newStatus, days: newDays };
        }
        return w;
      });
      const completedWeeks = newWeeks.filter(w => w.completed).length;
      const updated = { ...prev, weeks: newWeeks, completed_weeks_count: completedWeeks };
      persistPlan(updated);
      return updated;
    });
  };

  const applyPlanUpdateFromAI = (update: any) => {
    if (!update) return;
    setPlanState(prev => {
      let nextPlan = { ...prev };
      if (update.title) nextPlan.title = update.title;
      if (update.goal) nextPlan.goal = update.goal;

      if (update.updated_day) {
        const weekNum = update.week_number || prev.current_week || 1;
        nextPlan.weeks = nextPlan.weeks.map(w => {
          if (w.week_number === weekNum) {
            const targetDayName = update.day_name || update.updated_day.day_name;
            const existingIdx = w.days.findIndex(d => 
              d.day_name.toLowerCase().includes(targetDayName.toLowerCase()) ||
              targetDayName.toLowerCase().includes(d.day_name.toLowerCase())
            );
            const newDays = [...w.days];
            if (existingIdx >= 0) {
              newDays[existingIdx] = { ...newDays[existingIdx], ...update.updated_day };
            } else {
              newDays.push(update.updated_day);
            }
            return { ...w, days: newDays };
          }
          return w;
        });
      }
      else if (update.days && Array.isArray(update.days)) {
        const weekNum = update.week_number || prev.current_week || 1;
        nextPlan.weeks = nextPlan.weeks.map(w => {
          if (w.week_number === weekNum) {
            return { ...w, days: update.days };
          }
          return w;
        });
      } 
      else if (update.weeks && Array.isArray(update.weeks)) {
        nextPlan.weeks = update.weeks;
        nextPlan.weeks_count = 6;
      }

      persistPlan(nextPlan);
      return nextPlan;
    });
  };

  return (
    <PlanContext.Provider value={{ 
      plan, 
      setPlan, 
      updateDay, 
      addDay, 
      deleteDay, 
      toggleDayCompletion, 
      toggleWeekCompletion, 
      applyPlanUpdateFromAI,
      resetToDefaultPlan
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
