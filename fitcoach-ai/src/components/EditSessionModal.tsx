import { useState, useRef } from 'react';
import { supabase } from '../config/supabase';
import { usePlan } from '../contexts/PlanContext';
import { useModal } from '../contexts/ModalContext';
import { 
  X, Save, Calendar, Target, Loader2, Sparkles
} from 'lucide-react';

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  onSaved: (updatedSession: any) => void;
}

export default function EditSessionModal({
  isOpen,
  onClose,
  session,
  onSaved,
}: EditSessionModalProps) {
  const { plan, toggleDayCompletion } = usePlan();
  const { showToast, showAlert } = useModal();
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Form states initialized with session data
  const [title, setTitle] = useState(session?.title || '');
  const [sportType, setSportType] = useState(session?.sport_type || 'running');
  const [startDate, setStartDate] = useState(() => {
    if (!session?.started_at) return new Date().toISOString().slice(0, 16);
    const d = new Date(session.started_at);
    // Format to YYYY-MM-DDTHH:mm local
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const [distanceKm, setDistanceKm] = useState<string>(() => {
    return session?.distance_meters ? (session.distance_meters / 1000).toFixed(2) : '';
  });

  const [durationMin, setDurationMin] = useState<string>(() => {
    return session?.duration_seconds ? String(Math.round(session.duration_seconds / 60)) : '';
  });

  const [avgPaceStr, setAvgPaceStr] = useState<string>(() => {
    if (!session?.avg_pace_sec_per_km) return '';
    const mins = Math.floor(session.avg_pace_sec_per_km / 60);
    const secs = Math.round(session.avg_pace_sec_per_km % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  const [avgHr, setAvgHr] = useState<string>(() => {
    return session?.avg_heart_rate ? String(session.avg_heart_rate) : '';
  });

  const [maxHr, setMaxHr] = useState<string>(() => {
    return session?.max_heart_rate ? String(session.max_heart_rate) : '';
  });

  const [calories, setCalories] = useState<string>(() => {
    return session?.calories_burned ? String(session.calories_burned) : '';
  });

  const [description, setDescription] = useState(session?.description || '');

  // Detect if already associated with a plan day or 'none'
  const [selectedPlanLink, setSelectedPlanLink] = useState<string>('none');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !session) return null;

  // Auto-calculate pace when distance or duration changes
  const handleAutoCalculatePace = (dist: string, dur: string) => {
    const d = Number(dist);
    const m = Number(dur);
    if (d > 0 && m > 0) {
      const totalSec = m * 60;
      const secPerKm = Math.round(totalSec / d);
      const mins = Math.floor(secPerKm / 60);
      const secs = secPerKm % 60;
      setAvgPaceStr(`${mins}:${secs.toString().padStart(2, '0')}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showAlert({
        title: 'Título requerido',
        message: 'Por favor ingresa un título para la sesión.',
        type: 'warning'
      });
      return;
    }

    setSaving(true);
    try {
      // Calculate sec per km from avgPaceStr
      let paceSec: number | null = null;
      if (avgPaceStr.includes(':')) {
        const [pMin, pSec] = avgPaceStr.split(':').map(Number);
        if (!isNaN(pMin) && !isNaN(pSec)) {
          paceSec = pMin * 60 + pSec;
        }
      } else if (!isNaN(Number(avgPaceStr)) && Number(avgPaceStr) > 0) {
        paceSec = Math.round(Number(avgPaceStr) * 60);
      }

      const updatedPayload: any = {
        title: title.trim(),
        sport_type: sportType,
        started_at: new Date(startDate).toISOString(),
        distance_meters: distanceKm ? Math.round(Number(distanceKm) * 1000) : null,
        duration_seconds: durationMin ? Math.round(Number(durationMin) * 60) : null,
        avg_pace_sec_per_km: paceSec,
        avg_heart_rate: avgHr ? Number(avgHr) : null,
        max_heart_rate: maxHr ? Number(maxHr) : null,
        calories_burned: calories ? Number(calories) : null,
        description: description.trim() || null,
      };

      const { data, error } = await supabase
        .from('training_sessions')
        .update(updatedPayload)
        .eq('id', session.id)
        .select()
        .single();

      if (error) throw error;

      // Si se vinculó a un día del plan, marcarlo como completado
      if (selectedPlanLink !== 'none') {
        const [wNum, dIdx] = selectedPlanLink.split('_').map(Number);
        const targetWeek = plan.weeks.find(w => w.week_number === wNum);
        const targetDay = targetWeek?.days?.[dIdx];
        if (targetDay && !targetDay.completed) {
          toggleDayCompletion(wNum, dIdx);
        }
      }

      showToast('¡Entrenamiento actualizado exitosamente!');
      onSaved(data || { ...session, ...updatedPayload });
      onClose();
    } catch (err: any) {
      console.error('Error actualizando sesión:', err);
      showAlert({
        title: 'Error al actualizar',
        message: err.message || 'No se pudieron guardar los cambios.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="surface border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start pb-2 border-b border-white/5">
          <div>
            <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} />
              Edición de Entrenamiento
            </span>
            <h2 className="text-lg font-bold mt-0.5">Editar Datos de la Sesión</h2>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Vincular con el Plan */}
          <div>
            <label className="block text-xs font-semibold opacity-80 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-white">
                <Target size={14} className="text-accent" />
                Vincular / Reasignar con Día del Plan
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                Marcará el día como completado ✅
              </span>
            </label>

            <select
              value={selectedPlanLink}
              onChange={(e) => setSelectedPlanLink(e.target.value)}
              className="w-full bg-[var(--bg-color)] border border-white/15 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-accent text-white font-medium cursor-pointer"
            >
              <option value="none">🏃 Sesión Libre / Extra (Sin asignar a un día del plan)</option>
              {plan.weeks.map(w => (
                <optgroup key={w.week_number} label={`Semana ${w.week_number}: ${w.focus}`}>
                  {w.days.map((d, dIdx) => (
                    <option key={dIdx} value={`${w.week_number}_${dIdx}`}>
                      {d.completed ? '✅ ' : '⏳ '} Sem. {w.week_number} • {d.day_name}: {d.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Título y Deporte */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold opacity-80 mb-1 text-white">
                Título del Entrenamiento
              </label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-[var(--bg-color)] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold opacity-80 mb-1 text-white">
                Disciplina
              </label>
              <select
                value={sportType}
                onChange={(e) => setSportType(e.target.value)}
                className="w-full bg-[var(--bg-color)] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent font-medium cursor-pointer"
              >
                <option value="running">🏃 Running</option>
                <option value="football">⚽ Fútbol</option>
                <option value="gym">🏋️ Gimnasio</option>
                <option value="other">🚴 Otro</option>
              </select>
            </div>
          </div>

          {/* Fecha y Hora con Botón de Calendario Visible */}
          <div>
            <label className="block text-xs font-semibold opacity-80 mb-1 text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-accent" /> Fecha y Hora
              </span>
              <button
                type="button"
                onClick={() => dateInputRef.current?.showPicker?.()}
                className="text-[10px] text-accent hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                📅 Abrir Calendario
              </button>
            </label>

            <div className="relative">
              <input 
                ref={dateInputRef}
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[var(--bg-color)] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent font-medium shadow-inner"
              />
            </div>
          </div>

          {/* Métricas Principales: Distancia, Tiempo, Ritmo */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold opacity-70 mb-1 text-cyan-400">
                Distancia (km)
              </label>
              <input 
                type="number"
                step="0.01"
                min="0"
                value={distanceKm}
                onChange={(e) => {
                  setDistanceKm(e.target.value);
                  handleAutoCalculatePace(e.target.value, durationMin);
                }}
                placeholder="ej: 5.2"
                className="w-full bg-[var(--bg-color)] border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-accent font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold opacity-70 mb-1 text-white">
                Duración (min)
              </label>
              <input 
                type="number"
                step="1"
                min="0"
                value={durationMin}
                onChange={(e) => {
                  setDurationMin(e.target.value);
                  handleAutoCalculatePace(distanceKm, e.target.value);
                }}
                placeholder="ej: 32"
                className="w-full bg-[var(--bg-color)] border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-accent font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold opacity-70 mb-1 text-accent">
                Ritmo (min/km)
              </label>
              <input 
                type="text"
                value={avgPaceStr}
                onChange={(e) => setAvgPaceStr(e.target.value)}
                placeholder="ej: 5:15"
                className="w-full bg-[var(--bg-color)] border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-accent font-bold text-accent"
              />
            </div>
          </div>

          {/* Métricas Cardiovasculares y Calorías */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold opacity-70 mb-1 text-red-400">
                FC Promedio (bpm)
              </label>
              <input 
                type="number"
                min="40"
                max="240"
                value={avgHr}
                onChange={(e) => setAvgHr(e.target.value)}
                placeholder="ej: 145"
                className="w-full bg-[var(--bg-color)] border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-accent font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold opacity-70 mb-1 text-red-300">
                FC Máxima (bpm)
              </label>
              <input 
                type="number"
                min="40"
                max="240"
                value={maxHr}
                onChange={(e) => setMaxHr(e.target.value)}
                placeholder="ej: 172"
                className="w-full bg-[var(--bg-color)] border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-accent font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold opacity-70 mb-1 text-amber-400">
                Calorías (kcal)
              </label>
              <input 
                type="number"
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="ej: 350"
                className="w-full bg-[var(--bg-color)] border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-accent font-medium"
              />
            </div>
          </div>

          {/* Notas / Descripción */}
          <div>
            <label className="block text-xs font-semibold opacity-80 mb-1 text-white">
              Notas y Sensaciones
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Sensaciones, terreno, zapatillas o detalles de la sesión..."
              className="w-full bg-[var(--bg-color)] border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-accent resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-white/5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5 transition cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-accent text-black text-xs font-bold hover:opacity-90 transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
