import { useState } from 'react';
import { usePlan, type TrainingDay, type PlanWeek } from '../contexts/PlanContext';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Target, CheckCircle2, Utensils, X,
  Zap, Flame, Clock, Navigation, ShieldCheck, Heart
} from 'lucide-react';

export default function Calendar() {
  const { plan } = usePlan();
  const [selectedWorkout, setSelectedWorkout] = useState<{ day: TrainingDay; weekNum: number } | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);

  const currentWeekData = plan.weeks.find((w: PlanWeek) => w.week_number === currentWeek) || plan.weeks[0];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendario de Entrenamientos</h1>
          <p className="opacity-60 text-sm">Sesiones estructuradas de tu plan sincronizadas por semana</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-accent/15 text-accent font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-accent/20">
            <Target size={14} />
            Objetivo: 4:30 min/km
          </div>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="surface p-4 rounded-2xl border border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-accent" />
          <div>
            <h2 className="font-bold text-base">
              Semana {currentWeek} de {plan.weeks_count || 8}
            </h2>
            <p className="text-xs opacity-60 line-clamp-1">{currentWeekData?.focus}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentWeek(prev => Math.max(prev - 1, 1))}
            disabled={currentWeek === 1}
            className="p-2 rounded-lg hover:bg-white/5 opacity-70 hover:opacity-100 disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-semibold px-2">Semana {currentWeek}</span>
          <button 
            onClick={() => setCurrentWeek(prev => Math.min(prev + 1, plan.weeks_count || 8))}
            disabled={currentWeek === (plan.weeks_count || 8)}
            className="p-2 rounded-lg hover:bg-white/5 opacity-70 hover:opacity-100 disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Workouts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {currentWeekData?.days?.map((item: TrainingDay, idx: number) => {
          const sportEmoji = {
            running: '🏃',
            football: '⚽',
            gym: '🏋️',
            rest: '🧘'
          }[item.sport] || '🏃';

          return (
            <div 
              key={idx} 
              onClick={() => setSelectedWorkout({ day: item, weekNum: currentWeek })}
              className={`surface p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between hover:border-accent hover:scale-[1.005] ${
                item.completed ? 'border-emerald-500/30' : 'border-white/5'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{sportEmoji}</span>
                    <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-lg text-accent">
                      {item.day_name}
                    </span>
                  </div>

                  {item.completed ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-emerald-400 bg-emerald-400/10 border-emerald-400/20 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Completado
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-amber-400 bg-amber-400/10 border-amber-400/20">
                      Programado
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-base mb-1">{item.title}</h3>
                {item.objective && (
                  <p className="text-xs opacity-70 line-clamp-2 mt-1 leading-relaxed">{item.objective}</p>
                )}

                {item.main_block && (
                  <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/5 text-xs">
                    <span className="font-bold text-accent text-[10px] block uppercase">Bloque Principal:</span>
                    <span className="opacity-90 line-clamp-1">{item.main_block}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                {item.target_pace ? (
                  <span className="font-bold text-accent">
                    Ritmo: {item.target_pace}
                  </span>
                ) : (
                  <span className="opacity-60">
                    {item.target_duration_min ? `${item.target_duration_min} min` : 'Sin tiempo fijo'}
                  </span>
                )}

                <span className="text-xs text-accent underline font-medium">Ver desglose</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Detallado con Bloques Estructurados al hacer Click en una Card */}
      {selectedWorkout && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedWorkout(null)}
        >
          <div 
            className="surface border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-4 relative shadow-2xl overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-white/5 pb-3">
              <div>
                <span className="text-xs font-bold text-accent uppercase tracking-wider">
                  {selectedWorkout.day.day_name} • Semana {selectedWorkout.weekNum}
                </span>
                <h2 className="text-xl font-bold mt-1">{selectedWorkout.day.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedWorkout(null)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* 🎯 Objetivo */}
            {selectedWorkout.day.objective && (
              <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/20 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wider">
                  <Target size={14} /> Objetivo de la Sesión
                </div>
                <p className="text-xs opacity-90 leading-relaxed font-medium">
                  {selectedWorkout.day.objective}
                </p>
              </div>
            )}

            {/* 🏃 Calentamiento */}
            {selectedWorkout.day.warmup && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <Flame size={13} /> Calentamiento:
                </span>
                <p className="text-xs opacity-85 leading-relaxed">{selectedWorkout.day.warmup}</p>
              </div>
            )}

            {/* ⚡ Bloque Principal */}
            {selectedWorkout.day.main_block && (
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                <span className="text-xs font-bold text-accent flex items-center gap-1">
                  <Zap size={14} /> Bloque Principal:
                </span>
                <p className="text-xs opacity-95 leading-relaxed font-semibold">{selectedWorkout.day.main_block}</p>
              </div>
            )}

            {/* 🚶 Recuperación */}
            {selectedWorkout.day.recovery && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                  <Clock size={13} /> Recuperación:
                </span>
                <p className="text-xs opacity-85 leading-relaxed">{selectedWorkout.day.recovery}</p>
              </div>
            )}

            {/* ❄️ Enfriamiento */}
            {selectedWorkout.day.cooldown && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                  <Navigation size={13} /> Enfriamiento / Vuelta a la Calma:
                </span>
                <p className="text-xs opacity-85 leading-relaxed">{selectedWorkout.day.cooldown}</p>
              </div>
            )}

            {/* ⚙️ Enfoque Técnico */}
            {selectedWorkout.day.technical_focus && (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1">
                  <ShieldCheck size={13} /> Enfoque Técnico & Cadencia:
                </span>
                <p className="text-xs opacity-90 leading-relaxed font-medium">{selectedWorkout.day.technical_focus}</p>
              </div>
            )}

            {/* Metas Numéricas / Ritmo */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
              {selectedWorkout.day.target_pace && (
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 col-span-2">
                  <p className="opacity-60 text-[10px]">Ritmo Objetivo</p>
                  <p className="text-base font-bold mt-0.5 text-accent">{selectedWorkout.day.target_pace}</p>
                </div>
              )}
              {selectedWorkout.day.target_hr_zone && (
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 col-span-2">
                  <p className="opacity-60 text-[10px] flex items-center justify-center gap-1">
                    <Heart size={11} className="text-red-400" /> Frecuencia Cardíaca
                  </p>
                  <p className="text-xs font-bold mt-0.5 text-red-400">{selectedWorkout.day.target_hr_zone}</p>
                </div>
              )}
            </div>

            {/* Nutrición */}
            {selectedWorkout.day.nutrition_tip && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Utensils size={13} />
                  Estrategia Nutricional Recomendada
                </div>
                <p className="text-xs opacity-85 leading-relaxed">
                  {selectedWorkout.day.nutrition_tip}
                </p>
              </div>
            )}

            {/* Huawei Sync Info */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs opacity-60">
              <span>Estado: {selectedWorkout.day.completed ? '✅ Realizado' : '⏳ Programado'}</span>
              <span className="text-accent text-[11px]">Sincronización Huawei Watch GT</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
