import React, { createContext, useContext, useState } from 'react';

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
          target_pace: "5'00\" - 5'25\" /km (en series)",
          target_hr_zone: 'Zona 4-5 (Series) / Zona 2 (Calentamiento y recuperación)',
          nutrition_tip: '500ml agua con electrolitos y carbohidrato simple 20 min antes.',
          completed: false,
        },
        {
          day_name: 'Día 2: Jueves',
          sport: 'running',
          title: 'Carrera Base (Desarrollo Aeróbico)',
          objective: 'Desarrollar tu red capilar y enseñar al cuerpo a usar la grasa como combustible, manteniendo el corazón en una zona segura de baja intensidad.',
          main_block: '35 a 45 minutos continuos de trote.',
          technical_focus: 'Concéntrate exclusivamente en mantener pasos cortos y una cadencia alta (alrededor de 160 pasos por minuto) para proteger tus articulaciones.',
          target_duration_min: '35-45',
          target_pace: "8'00\" - 8'30\" /km (Muy suave y conversacional)",
          target_hr_zone: 'Zona 2 (115 - 133 ppm)',
          nutrition_tip: 'Hidratación previa adecuada. No requiere geles durante el entrenamiento.',
          completed: false,
        },
        {
          day_name: 'Día 3: Sábado',
          sport: 'running',
          title: 'Ritmo Umbral (Tempo Controlado)',
          objective: 'Acostumbrar a las piernas a sostener un ritmo más ágil reciclando el ácido láctico sin llegar al agotamiento total.',
          warmup: '10 minutos de trote suave.',
          main_block: '3 series de 5 minutos a ritmo sostenido y controlado (entre 7\'00" y 7\'15"/km).',
          recovery: '2 minutos de caminata obligatoria entre cada bloque de 5 min para bajar pulsaciones y relajar el diafragma.',
          cooldown: '3 a 5 minutos de caminata.',
          target_duration_min: '40',
          target_pace: "7'00\" - 7'15\" /km (en bloques tempo)",
          target_hr_zone: 'Zona 3-4 (Umbral anaeróbico)',
          nutrition_tip: 'Desayuno ligero con avena y plátano 90 min antes.',
          completed: false,
        },
        {
          day_name: 'Día 4: Domingo',
          sport: 'running',
          title: 'Tirada Larga (Resistencia Pura)',
          objective: 'Sumar volumen y tiempo sobre los pies para desarrollar hipertrofia cardíaca (un corazón más fuerte) y resistencia mental.',
          main_block: '6 kilómetros continuos.',
          technical_focus: 'Regla de Oro: Prohibido acelerar. Aquí no importa el reloj, solo importa completar la distancia manteniendo la cadencia fluida sin que las pulsaciones se disparen.',
          target_distance_km: '6.0',
          target_duration_min: '50',
          target_pace: "8'15\" - 8'30\" /km (Lento y relajado)",
          target_hr_zone: 'Zona 2 estricta (115 - 133 ppm)',
          nutrition_tip: '300ml de agua con electrolitos cada 20 min de carrera.',
          completed: false,
        },
      ],
    },
    {
      week_number: 2,
      focus: 'Aumento de repeticiones a 10x200m y consolidación de base en 45 min',
      completed: false,
      days: [
        {
          day_name: 'Día 1: Martes',
          sport: 'running',
          title: 'Intervalos Cortos (10 x 200m)',
          objective: 'Aumentar densidad de repeticiones a ritmo vivo para consolidar técnica de zancada eficiente.',
          warmup: '10 min de trote muy suave a Zona 2 (115-133 ppm) + movilidad dinámica.',
          main_block: '10 repeticiones de 200m a ritmo entre 4\'55" y 5\'20"/km.',
          recovery: '1 minuto de caminata activa entre repeticiones (<115 ppm).',
          cooldown: '5 min de caminata suave.',
          target_pace: "4'55\" - 5'20\" /km",
          target_hr_zone: 'Zona 4-5 en series',
          nutrition_tip: 'Electrolitos antes de iniciar.',
          completed: false,
        },
        {
          day_name: 'Día 2: Jueves',
          sport: 'running',
          title: 'Carrera Base (45 min Continuos)',
          objective: 'Incrementar la densidad mitocondrial y volumen en Zona 2.',
          main_block: '45 minutos continuos de trote suave.',
          technical_focus: 'Cadencia 160-165 spm, apoyo de mediopié y postura erguida.',
          target_duration_min: '45',
          target_pace: "7'50\" - 8'20\" /km",
          target_hr_zone: 'Zona 2 (115 - 133 ppm)',
          nutrition_tip: '500ml de agua con sales pre-entreno.',
          completed: false,
        },
        {
          day_name: 'Día 3: Sábado',
          sport: 'running',
          title: 'Tempo de Umbral (3 x 6 min)',
          objective: 'Extender el tiempo bajo aclaramiento de lactato a ritmo alegre.',
          warmup: '10 min trote suave.',
          main_block: '3 series de 6 minutos a ritmo de 6\'50" - 7\'05"/km.',
          recovery: '2 minutos de caminata activa.',
          cooldown: '5 min de enfriamiento.',
          target_pace: "6'50\" - 7'05\" /km",
          target_hr_zone: 'Zona 3-4',
          nutrition_tip: 'Carbohidratos complejos 2 horas antes.',
          completed: false,
        },
        {
          day_name: 'Día 4: Domingo',
          sport: 'running',
          title: 'Tirada Larga Aeróbica (7 km)',
          objective: 'Aumento progresivo de 1 km de fondo puro.',
          main_block: '7 kilómetros continuos a ritmo constante.',
          technical_focus: 'Respiración rítmica y hombros relajados.',
          target_distance_km: '7.0',
          target_pace: "8'10\" - 8'25\" /km",
          target_hr_zone: 'Zona 2 estricta',
          nutrition_tip: 'Llevar hidratación para sorbos cada 15-20 min.',
          completed: false,
        },
      ],
    },
    {
      week_number: 3,
      focus: 'Transición a series medias: 6x400m y tempo de 15 min continuo',
      completed: false,
      days: [
        {
          day_name: 'Día 1: Martes',
          sport: 'running',
          title: 'Series de 400m (6 x 400m @ 4:45/km)',
          objective: 'Desarrollar tolerancia a la fatiga en distancias medias a ritmo objetivo.',
          warmup: '12 min trote + 3 progresiones de 50m.',
          main_block: '6 repeticiones de 400m entre 4\'40" y 4\'55"/km.',
          recovery: '90 segundos de caminata activa.',
          cooldown: '5 min trote suave y caminata.',
          target_pace: "4'40\" - 4'55\" /km",
          target_hr_zone: 'Zona 4-5',
          nutrition_tip: '1 gel o dátiles 15 min antes.',
          completed: false,
        },
        {
          day_name: 'Día 2: Jueves',
          sport: 'running',
          title: 'Rodaje Regenerativo & Cadencia (40 min)',
          objective: 'Recuperación activa y eficiencia biomecánica.',
          main_block: '40 minutos a ritmo muy suave.',
          technical_focus: 'Buscar 165 pasos por minuto constantes.',
          target_duration_min: '40',
          target_pace: "8'00\" - 8'30\" /km",
          target_hr_zone: 'Zona 2 baja (<125 ppm)',
          nutrition_tip: 'Batido hidratante posterior con fruta.',
          completed: false,
        },
        {
          day_name: 'Día 3: Sábado',
          sport: 'running',
          title: 'Bloque Continuo de Tempo (15 min @ 6:35/km)',
          objective: 'Sostener el umbral anaeróbico sin pausas intermedias.',
          warmup: '10 min trote suave.',
          main_block: '15 minutos continuos a ritmo 6\'35" - 6\'50"/km.',
          cooldown: '8 min de trote muy lento y caminata.',
          target_pace: "6'35\" - 6'50\" /km",
          target_hr_zone: 'Zona 4',
          nutrition_tip: 'Desayuno rico en glucógeno.',
          completed: false,
        },
        {
          day_name: 'Día 4: Domingo',
          sport: 'running',
          title: 'Tirada Larga (8 km)',
          objective: 'Incrementar resistencia de base a 8 kilómetros.',
          main_block: '8 kilómetros a ritmo controlado.',
          technical_focus: 'Economía de carrera y respiración controlada.',
          target_distance_km: '8.0',
          target_pace: "8'00\" - 8'20\" /km",
          target_hr_zone: 'Zona 2',
          nutrition_tip: '1 gel en el km 5 + agua con sales.',
          completed: false,
        },
      ],
    },
    {
      week_number: 4,
      focus: 'Series de 800m y aumento de velocidad crucero en tempo',
      completed: false,
      days: [
        {
          day_name: 'Día 1: Martes',
          sport: 'running',
          title: 'Series de 800m (4 x 800m @ 4:40/km)',
          objective: 'Estimular consumo máximo de oxígeno en repeticiones largas.',
          warmup: '12 min trote + estiramientos dinámicos.',
          main_block: '4 series de 800m a ritmo 4\'35" - 4\'45"/km.',
          recovery: '2 minutos de caminata activa.',
          cooldown: '5 min caminata.',
          target_pace: "4'35\" - 4'45\" /km",
          target_hr_zone: 'Zona 4-5',
          nutrition_tip: 'Carbohidratos 1h antes.',
          completed: false,
        },
        {
          day_name: 'Día 2: Jueves',
          sport: 'running',
          title: 'Carrera Base (45 min)',
          objective: 'Consolidación aeróbica.',
          main_block: '45 minutos en Zona 2.',
          target_duration_min: '45',
          target_pace: "7'45\" - 8'15\" /km",
          target_hr_zone: 'Zona 2',
          nutrition_tip: 'Hidratación completa.',
          completed: false,
        },
        {
          day_name: 'Día 3: Sábado',
          sport: 'running',
          title: 'Tempo Sostenido (20 min @ 6:15/km)',
          objective: 'Aumentar velocidad crucero en umbral.',
          warmup: '10 min trote suave.',
          main_block: '20 minutos continuos a 6\'15" - 6\'30"/km.',
          cooldown: '8 min enfriamiento.',
          target_pace: "6'15\" - 6'30\" /km",
          target_hr_zone: 'Zona 4',
          nutrition_tip: 'Snack energético previo.',
          completed: false,
        },
        {
          day_name: 'Día 4: Domingo',
          sport: 'running',
          title: 'Tirada Larga Progresiva (9 km)',
          objective: 'Resistencia pura terminando el último km a ritmo más vivo.',
          main_block: '9 kilómetros: 8 km en Zona 2 + último km a 6:00/km.',
          target_distance_km: '9.0',
          target_pace: "7'50\" - 8'15\" /km",
          target_hr_zone: 'Zona 2-3',
          nutrition_tip: '1 gel en el km 5 + bebida isotónica.',
          completed: false,
        },
      ],
    },
    {
      week_number: 5,
      focus: 'Fase Pico de Potencia VO2max: Series específicas a 4:30/km',
      completed: false,
      days: [
        {
          day_name: 'Día 1: Martes',
          sport: 'running',
          title: 'Series Específicas (5 x 800m @ 4:30/km)',
          objective: 'Aclimatar el cuerpo al ritmo objetivo exacto de carrera de 4:30 min/km.',
          warmup: '15 min trote suave + 4 progresiones de 60m.',
          main_block: '5 repeticiones de 800m exactamente a ritmo de 4\'30"/km.',
          recovery: '2 minutos de caminata/trote muy suave.',
          cooldown: '5 min caminata.',
          target_pace: "4'30\" /km (Ritmo Objetivo)",
          target_hr_zone: 'Zona 5 (Pico de VO2max)',
          nutrition_tip: 'Carbohidratos rápidos 20 min antes.',
          completed: false,
        },
        {
          day_name: 'Día 2: Jueves',
          sport: 'running',
          title: 'Rodaje Aeróbico Suave (40 min)',
          objective: 'Asimilación del trabajo de potencia.',
          main_block: '40 minutos a ritmo muy suave.',
          target_duration_min: '40',
          target_pace: "8'00\" - 8'30\" /km",
          target_hr_zone: 'Zona 2',
          nutrition_tip: 'Proteína y carbohidratos post-carrera.',
          completed: false,
        },
        {
          day_name: 'Día 3: Sábado',
          sport: 'running',
          title: 'Fartlek Mixto (5K con cambios de ritmo)',
          objective: 'Capacidad de acelerar con soltura aeróbica.',
          warmup: '10 min trote.',
          main_block: '5 km combinando 500m suaves / 500m a 4:40/km.',
          cooldown: '6 min enfriamiento.',
          target_pace: "Variable",
          target_hr_zone: 'Zona 3-4',
          nutrition_tip: 'Desayuno ligero.',
          completed: false,
        },
        {
          day_name: 'Día 4: Domingo',
          sport: 'running',
          title: 'Tirada Larga Máxima del Ciclo (10 km)',
          objective: 'Pico máximo de volumen aeróbico del ciclo de 6 semanas.',
          main_block: '10 kilómetros continuos y relajados.',
          target_distance_km: '10.0',
          target_pace: "7'55\" - 8'20\" /km",
          target_hr_zone: 'Zona 2',
          nutrition_tip: '2 tomas de hidratación / gel en km 4 y km 7.',
          completed: false,
        },
      ],
    },
    {
      week_number: 6,
      focus: 'Tapering, descanso activo y Test Oficial 5K Sub 4:30 min/km',
      completed: false,
      days: [
        {
          day_name: 'Día 1: Martes',
          sport: 'running',
          title: 'Activación con Progresiones (25 min + 4 rectas)',
          objective: 'Mantener la reactividad de pies y tono nervioso sin fatigar.',
          warmup: '15 min trote muy suave.',
          main_block: '4 aceleraciones de 80m progresivas hasta 4:15/km con descanso total.',
          cooldown: '5 min caminata.',
          target_duration_min: '25',
          target_pace: "Suave + rectas vivas",
          target_hr_zone: 'Zona 2-4',
          nutrition_tip: 'Comida rica en carbohidratos limpios.',
          completed: false,
        },
        {
          day_name: 'Día 2: Jueves',
          sport: 'running',
          title: 'Trote Muy Ligero de Soltura (20 min)',
          objective: 'Estimulación circulatoria y soltura muscular.',
          main_block: '20 minutos de trote ultra suave en Zona 1-2.',
          target_duration_min: '20',
          target_pace: "8'30\" /km",
          target_hr_zone: 'Zona 1-2',
          nutrition_tip: 'Excelente descanso nocturno e hidratación.',
          completed: false,
        },
        {
          day_name: 'Día 3: Viernes',
          sport: 'rest',
          title: 'Descanso Total Pre-Test',
          objective: 'Llegar con los depósitos de glucógeno llenos y piernas 100% frescas.',
          main_block: 'Día libre de entrenamientos. Caminata ligera opcional.',
          nutrition_tip: 'Cena con pasta o arroz, proteína magra y 500ml de agua.',
          completed: false,
        },
        {
          day_name: 'Día 4: Domingo',
          sport: 'running',
          title: '🏆 TEST OFICIAL DE 5K A RITMO OBJETIVO (Sub 4:30 /km)',
          objective: '¡Día de prueba! Aplicar toda la base aeróbica y velocidad para marcar tu mejor registro a 4:30 min/km (Tiempo meta: 22:30).',
          warmup: '10 min trote suave + movilidad articular + 3 rectas de activación.',
          main_block: '5 Kilómetros continuos a ritmo objetivo de 4:30 min/km.',
          cooldown: '10 min caminata y estiramientos.',
          target_distance_km: '5.0',
          target_pace: "4:30 min/km (Meta oficial)",
          target_hr_zone: 'Zona 4-5',
          nutrition_tip: 'Desayuno 2.5h antes. Gel 15 min antes de la salida.',
          completed: false,
        },
      ],
    },
  ],
};

interface PlanContextType {
  plan: TrainingPlan;
  setPlan: (plan: TrainingPlan) => void;
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

  const setPlan = (newPlan: TrainingPlan) => {
    setPlanState(newPlan);
    localStorage.setItem('fitcoach_active_plan_v2', JSON.stringify(newPlan));
  };

  const resetToDefaultPlan = () => {
    setPlanState(INITIAL_6_WEEK_PLAN);
    localStorage.setItem('fitcoach_active_plan_v2', JSON.stringify(INITIAL_6_WEEK_PLAN));
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
      localStorage.setItem('fitcoach_active_plan_v2', JSON.stringify(updated));
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
      localStorage.setItem('fitcoach_active_plan_v2', JSON.stringify(updated));
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
      localStorage.setItem('fitcoach_active_plan_v2', JSON.stringify(updated));
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
      localStorage.setItem('fitcoach_active_plan_v2', JSON.stringify(updated));
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
      localStorage.setItem('fitcoach_active_plan_v2', JSON.stringify(updated));
      return updated;
    });
  };

  const applyPlanUpdateFromAI = (update: any) => {
    if (!update) return;
    setPlanState(prev => {
      let nextPlan = { ...prev };
      if (update.title) nextPlan.title = update.title;
      if (update.goal) nextPlan.goal = update.goal;

      // Si viene un día específico
      if (update.updated_day) {
        const weekNum = update.week_number || prev.current_week || 1;
        nextPlan.weeks = nextPlan.weeks.map(w => {
          if (w.week_number === weekNum) {
            // Reemplazar si coincide por nombre o insertar
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
      // Si vienen todos los días de una semana
      else if (update.days && Array.isArray(update.days)) {
        const weekNum = update.week_number || prev.current_week || 1;
        nextPlan.weeks = nextPlan.weeks.map(w => {
          if (w.week_number === weekNum) {
            return { ...w, days: update.days };
          }
          return w;
        });
      } 
      // Si vienen las semanas completas
      else if (update.weeks && Array.isArray(update.weeks)) {
        nextPlan.weeks = update.weeks;
        nextPlan.weeks_count = 6;
      }

      localStorage.setItem('fitcoach_active_plan_v2', JSON.stringify(nextPlan));
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
