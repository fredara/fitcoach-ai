import { 
  X, Trash2, Edit3, Sparkles, Activity, Clock, Flame, Heart, 
  Timer, Calendar, RefreshCw
} from 'lucide-react';

interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onOpenEdit: () => void;
  onDelete: () => void;
  onReanalyze?: () => void;
  isAnalyzing?: boolean;
}

export default function SessionDetailModal({
  isOpen,
  onClose,
  session,
  onOpenEdit,
  onDelete,
  onReanalyze,
  isAnalyzing,
}: SessionDetailModalProps) {
  if (!isOpen || !session) return null;

  const sportEmoji: Record<string, string> = {
    running: '🏃',
    football: '⚽',
    gym: '🏋️',
    walking: '🚶',
    cycling: '🚴',
    other: '🏃'
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0 min';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs > 0 ? `${secs}s` : ''}`;
  };

  const formatPace = (secPerKm?: number) => {
    if (!secPerKm) return 'N/A';
    const mins = Math.floor(secPerKm / 60);
    const secs = Math.round(secPerKm % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs} /km`;
  };

  const dateStr = new Date(session.started_at).toLocaleString('es-ES', { 
    dateStyle: 'full', 
    timeStyle: 'short' 
  });

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
              session.sport_type === 'running' ? 'bg-amber-500/20 text-amber-400' :
              session.sport_type === 'football' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {sportEmoji[session.sport_type] || '🏃'}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-accent bg-accent/15 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  {session.sport_type}
                </span>
                <span className="text-xs opacity-60 flex items-center gap-1">
                  <Calendar size={12} /> {dateStr}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">{session.title}</h2>
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
        <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenEdit}
              className="bg-accent text-black font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md hover:opacity-90"
            >
              <Edit3 size={14} />
              <span>Editar Sesión</span>
            </button>

            {onReanalyze && (
              <button
                type="button"
                onClick={onReanalyze}
                disabled={isAnalyzing}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-white/10 disabled:opacity-50"
              >
                <RefreshCw size={13} className={isAnalyzing ? 'animate-spin' : ''} />
                <span>{isAnalyzing ? 'Analizando...' : 'Re-analizar con IA'}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onDelete}
            className="text-red-400 hover:bg-red-500/20 p-2 rounded-xl transition cursor-pointer border border-transparent hover:border-red-500/30"
            title="Eliminar sesión"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] opacity-60 uppercase font-semibold flex items-center justify-center gap-1">
              <Clock size={12} /> Duración
            </span>
            <p className="text-base font-bold text-white">{formatDuration(session.duration_seconds)}</p>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] opacity-60 uppercase font-semibold flex items-center justify-center gap-1 text-cyan-400">
              <Activity size={12} /> Distancia
            </span>
            <p className="text-base font-bold text-cyan-400">
              {session.distance_meters ? `${(session.distance_meters / 1000).toFixed(2)} km` : '--'}
            </p>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] opacity-60 uppercase font-semibold flex items-center justify-center gap-1 text-accent">
              <Timer size={12} /> Ritmo Medio
            </span>
            <p className="text-base font-bold text-accent">
              {session.avg_pace_sec_per_km ? formatPace(session.avg_pace_sec_per_km) : '--'}
            </p>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] opacity-60 uppercase font-semibold flex items-center justify-center gap-1 text-amber-400">
              <Flame size={12} /> Calorías
            </span>
            <p className="text-base font-bold text-amber-400">
              {session.calories_burned ? `${session.calories_burned} kcal` : '--'}
            </p>
          </div>
        </div>

        {/* Frecuencia Cardíaca */}
        {session.avg_heart_rate ? (
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-500/15 text-red-400">
                <Heart size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Frecuencia Cardíaca</p>
                <p className="text-[11px] opacity-60">Zona cardiovascular de la sesión</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-red-400">{session.avg_heart_rate} bpm</span>
              {session.max_heart_rate && (
                <span className="text-xs opacity-60 block">Pico: {session.max_heart_rate} bpm</span>
              )}
            </div>
          </div>
        ) : null}

        {/* Coach IA Technical Diagnostic */}
        {session.ai_analysis ? (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
              <Sparkles size={15} /> Diagnóstico del Coach IA
            </div>

            {session.ai_analysis.summary && (
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed font-medium">
                {session.ai_analysis.summary}
              </p>
            )}

            {session.ai_analysis.pros && session.ai_analysis.pros.length > 0 && (
              <div className="space-y-1.5 bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-400 block">
                  👍 Puntos Fuertes (Pros):
                </span>
                <ul className="text-xs opacity-90 space-y-1 list-disc list-inside">
                  {session.ai_analysis.pros.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {session.ai_analysis.improvements && session.ai_analysis.improvements.length > 0 && (
              <div className="space-y-1.5 bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20">
                <span className="text-xs font-bold text-amber-400 block">
                  💡 Oportunidades de Mejora:
                </span>
                <ul className="text-xs opacity-90 space-y-1 list-disc list-inside">
                  {session.ai_analysis.improvements.map((imp: string, i: number) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* Notas / Descripción */}
        {session.description && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-[11px] font-bold opacity-60 uppercase">Notas del Atleta:</span>
            <p className="text-xs sm:text-sm opacity-85 leading-relaxed">{session.description}</p>
          </div>
        )}

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
