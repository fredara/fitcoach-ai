import { 
  X, CheckCircle2, Circle, Edit3, Trash2, Sparkles, Target, 
  Flame, Zap, Clock, Navigation, ShieldCheck, Heart, Utensils
} from 'lucide-react';
import type { TrainingDay } from '../contexts/PlanContext';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: TrainingDay;
  weekNumber: number;
  dayIndex: number;
  onToggleComplete: () => void;
  onOpenRegister: () => void;
  onOpenEdit: () => void;
  onDelete: () => void;
}

export default function DayDetailModal({
  isOpen,
  onClose,
  day,
  weekNumber,
  onToggleComplete,
  onOpenRegister,
  onOpenEdit,
  onDelete,
}: DayDetailModalProps) {
  if (!isOpen || !day) return null;

  const sportEmoji = {
    running: '🏃',
    football: '⚽',
    gym: '🏋️',
    rest: '🧘'
  }[day.sport] || '🏃';

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="surface border border-white/15 rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
              day.sport === 'running' ? 'bg-amber-500/20 text-amber-400' :
              day.sport === 'football' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {sportEmoji}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent bg-accent/15 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  Semana {weekNumber} • {day.day_name}
                </span>
                <span className="text-xs font-semibold opacity-60 uppercase">
                  {day.sport}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">{day.title}</h2>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/5">
          <button
            type="button"
            onClick={onToggleComplete}
            className={`text-xs px-3.5 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-2 border shadow-sm ${
              day.completed 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' 
                : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
            }`}
          >
            {day.completed ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Entrenamiento Completado ✅</span>
              </>
            ) : (
              <>
                <Circle size={16} className="opacity-60" />
                <span>Marcar como Completado</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenEdit}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-white/10"
              title="Editar parámetros del día"
            >
              <Edit3 size={14} />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="text-red-400 hover:bg-red-500/20 p-2 rounded-xl transition cursor-pointer border border-transparent hover:border-red-500/30"
              title="Eliminar este día del plan"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Primary CTA: Register Workout with Photo / AI */}
        <button
          type="button"
          onClick={onOpenRegister}
          className="w-full py-3 px-4 rounded-2xl bg-accent text-black font-extrabold text-xs sm:text-sm hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg tracking-wide"
        >
          <Sparkles size={16} />
          Registrar este Entrenamiento Realizado (Foto / Texto con IA)
        </button>

        {/* Structured Blocks Grid */}
        <div className="space-y-3.5 pt-1">
          
          {/* 🎯 Objetivo de la sesión */}
          {day.objective && (
            <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
                <Target size={15} /> Objetivo Fisiológico & Neuromuscular
              </div>
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed font-medium">
                {day.objective}
              </p>
            </div>
          )}

          {/* ⚡ Bloque Principal */}
          {day.main_block && (
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-1.5">
              <span className="text-xs sm:text-sm font-extrabold text-accent flex items-center gap-1.5 uppercase tracking-wide">
                <Zap size={16} /> Bloque Principal de la Sesión:
              </span>
              <p className="text-xs sm:text-sm opacity-95 leading-relaxed font-semibold">
                {day.main_block}
              </p>
            </div>
          )}

          {/* Calentamiento, Recuperación y Enfriamiento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {day.warmup && (
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Flame size={14} /> Calentamiento
                </span>
                <p className="text-xs opacity-85 leading-relaxed">{day.warmup}</p>
              </div>
            )}

            {day.recovery && (
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Clock size={14} /> Recuperación
                </span>
                <p className="text-xs opacity-85 leading-relaxed">{day.recovery}</p>
              </div>
            )}

            {day.cooldown && (
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Navigation size={14} /> Vuelta a la Calma
                </span>
                <p className="text-xs opacity-85 leading-relaxed">{day.cooldown}</p>
              </div>
            )}
          </div>

          {/* Ritmo Meta y Frecuencia Cardíaca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {day.target_pace && (
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between">
                <p className="text-xs font-semibold opacity-60">Ritmo Objetivo (Pace)</p>
                <p className="text-base font-bold text-accent mt-1">{day.target_pace}</p>
              </div>
            )}

            {day.target_hr_zone && (
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between">
                <p className="text-xs font-semibold opacity-60 flex items-center gap-1.5">
                  <Heart size={14} className="text-red-400" /> Frecuencia Cardíaca
                </p>
                <p className="text-xs sm:text-sm font-bold text-red-400 mt-1">{day.target_hr_zone}</p>
              </div>
            )}
          </div>

          {/* ⚙️ Enfoque Técnico */}
          {day.technical_focus && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                <ShieldCheck size={15} /> Enfoque Técnico & Cadencia:
              </span>
              <p className="text-xs opacity-90 leading-relaxed font-medium">{day.technical_focus}</p>
            </div>
          )}

          {/* 🥑 Nutrición e Hidratación */}
          {day.nutrition_tip && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Utensils size={14} /> Estrategia de Nutrición e Hidratación
              </div>
              <p className="text-xs opacity-85 leading-relaxed">
                {day.nutrition_tip}
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
