import { useState, useRef } from 'react';
import { api } from '../services/api';
import { usePlan } from '../contexts/PlanContext';
import { 
  X, Sparkles, Image as ImageIcon, CheckCircle2, 
  Calendar, ArrowRight, Loader2, ClipboardPaste, Target
} from 'lucide-react';

interface RegisterWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle?: string;
  targetDayName?: string;
  initialWeekNum?: number;
  initialDayIndex?: number;
  onSuccess?: (savedSession: any) => void;
}

export default function RegisterWorkoutModal({
  isOpen,
  onClose,
  defaultTitle,
  targetDayName,
  initialWeekNum,
  initialDayIndex,
  onSuccess,
}: RegisterWorkoutModalProps) {
  const { plan, toggleDayCompletion } = usePlan();
  
  const [description, setDescription] = useState('');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [selectedPlanLink, setSelectedPlanLink] = useState<string>(() => {
    if (initialWeekNum !== undefined && initialDayIndex !== undefined) {
      return `${initialWeekNum}_${initialDayIndex}`;
    }
    return 'none';
  });

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const promises: Promise<string>[] = [];
    for (let i = 0; i < files.length; i++) {
      promises.push(processImageFile(files[i]));
    }
    const base64List = await Promise.all(promises);
    const validList = base64List.filter(Boolean);
    setSelectedImages((prev) => [...prev, ...validList]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Soporte para pegar imágenes con Ctrl + V sin duplicados
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      const promises = imageFiles.map(processImageFile);
      const base64Results = await Promise.all(promises);
      const validResults = base64Results.filter(Boolean);
      
      setSelectedImages((prev) => {
        const newUnique = validResults.filter(newImg => !prev.includes(newImg));
        return [...prev, ...newUnique];
      });
    }
  };

  // Soporte para arrastrar y soltar (Drag & Drop)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const promises: Promise<string>[] = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        promises.push(processImageFile(files[i]));
      }
    }
    if (promises.length > 0) {
      const base64List = await Promise.all(promises);
      const validList = base64List.filter(Boolean);
      setSelectedImages((prev) => [...prev, ...validList]);
    }
  };

  const removeImageAt = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && selectedImages.length === 0) {
      setErrorMsg('Por favor escribe cómo te fue o pega/sube al menos una foto de tu reloj.');
      return;
    }

    setProcessing(true);
    setErrorMsg(null);

    try {
      let finalTitle = defaultTitle || targetDayName;
      if (selectedPlanLink !== 'none') {
        const [wNum, dIdx] = selectedPlanLink.split('_').map(Number);
        const targetWeek = plan.weeks.find(w => w.week_number === wNum);
        const targetDay = targetWeek?.days?.[dIdx];
        if (targetDay) {
          finalTitle = `Semana ${wNum} • ${targetDay.title}`;
        }
      }

      const res = await api.parseAndLogSession({
        text: description.trim() || undefined,
        images: selectedImages.length > 0 ? selectedImages : undefined,
        date: new Date(sessionDate).toISOString(),
        defaultTitle: finalTitle || 'Entrenamiento Realizado',
      });

      if (res.success && res.session) {
        // Si se vinculó a un día del plan, marcar automáticamente como completado
        if (selectedPlanLink !== 'none') {
          const [wNum, dIdx] = selectedPlanLink.split('_').map(Number);
          const targetWeek = plan.weeks.find(w => w.week_number === wNum);
          const targetDay = targetWeek?.days?.[dIdx];
          if (targetDay && !targetDay.completed) {
            toggleDayCompletion(wNum, dIdx);
          }
        }

        setResultData(res);
        if (onSuccess) {
          onSuccess(res.session);
        }
      } else {
        throw new Error('No se pudo registrar la sesión.');
      }
    } catch (err: any) {
      console.error('Error procesando sesión:', err);
      setErrorMsg(err.message || 'Error al procesar el entrenamiento');
    } finally {
      setProcessing(false);
    }
  };

  const handleFinishAndClose = () => {
    setResultData(null);
    setDescription('');
    setSelectedImages([]);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="surface border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        onPaste={handlePaste}
      >
        <div className="flex justify-between items-start pb-2 border-b border-white/5">
          <div>
            <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} />
              Registro Inteligente con Coach IA
            </span>
            <h2 className="text-lg font-bold mt-0.5">
              {defaultTitle ? `Registrar ${defaultTitle}` : 'Registrar Entrenamiento'}
            </h2>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success / Result View */}
        {resultData ? (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 size={18} />
                ¡Entrenamiento Guardado en tu Historial!
              </div>
              <p className="text-xs text-emerald-300/90 leading-relaxed">
                {selectedPlanLink !== 'none' ? '✅ Asociado al día de tu plan y sincronizado con tu perfil.' : 'Sincronizado con tu perfil de atleta.'}
              </p>
            </div>

            {/* Metrics Extracted Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {resultData.session?.distance_meters ? (
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] opacity-60">Distancia</p>
                  <p className="text-sm font-bold mt-0.5 text-cyan-400">
                    {(Number(resultData.session.distance_meters) / 1000).toFixed(2)} km
                  </p>
                </div>
              ) : null}

              {resultData.session?.duration_seconds ? (
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] opacity-60">Tiempo</p>
                  <p className="text-sm font-bold mt-0.5">
                    {Math.round(Number(resultData.session.duration_seconds) / 60)} min
                  </p>
                </div>
              ) : null}

              {resultData.session?.avg_pace_sec_per_km ? (
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] opacity-60">Ritmo Medio</p>
                  <p className="text-sm font-bold mt-0.5 text-accent">
                    {Math.floor(resultData.session.avg_pace_sec_per_km / 60)}:
                    {(resultData.session.avg_pace_sec_per_km % 60).toString().padStart(2, '0')} /km
                  </p>
                </div>
              ) : null}

              {resultData.session?.avg_heart_rate ? (
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] opacity-60">FC Promedio</p>
                  <p className="text-sm font-bold mt-0.5 text-red-400">
                    {resultData.session.avg_heart_rate} bpm
                  </p>
                </div>
              ) : null}

              {resultData.session?.calories_burned ? (
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] opacity-60">Calorías</p>
                  <p className="text-sm font-bold mt-0.5 text-amber-400">
                    {resultData.session.calories_burned} kcal
                  </p>
                </div>
              ) : null}
            </div>

            {/* Coach IA Feedback (Pros & Improvements) */}
            {resultData.analysis && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
                  <Sparkles size={14} /> Diagnóstico del Coach IA
                </div>

                {resultData.analysis.summary && (
                  <p className="text-xs opacity-90 leading-relaxed font-medium">
                    {resultData.analysis.summary}
                  </p>
                )}

                {resultData.analysis.pros && resultData.analysis.pros.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-emerald-400 block">
                      👍 Puntos Fuertes (Pros):
                    </span>
                    <ul className="text-xs opacity-85 space-y-0.5 list-disc list-inside">
                      {resultData.analysis.pros.map((p: string, i: number) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {resultData.analysis.improvements && resultData.analysis.improvements.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-amber-400 block">
                      💡 Oportunidades de Mejora:
                    </span>
                    <ul className="text-xs opacity-85 space-y-0.5 list-disc list-inside">
                      {resultData.analysis.improvements.map((imp: string, i: number) => (
                        <li key={i}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleFinishAndClose}
              className="w-full py-2.5 rounded-xl bg-accent text-black font-bold text-xs hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              Cerrar y Ver en Historial <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Selector de Asociación con el Plan de 6 Semanas */}
            <div>
              <label className="block text-xs font-semibold opacity-80 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-white">
                  <Target size={14} className="text-accent" />
                  Vincular con Día del Plan
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Auto-completa el día en tu Plan ✅
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

            {/* Fecha del Entrenamiento */}
            <div>
              <label className="block text-xs font-semibold opacity-80 mb-1 text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-accent" /> Fecha y Hora del Entrenamiento
                </span>
                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  className="text-[10px] text-accent hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  📅 Abrir Calendario
                </button>
              </label>
              <input 
                ref={dateInputRef}
                type="datetime-local"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full bg-[var(--bg-color)] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-accent font-medium shadow-inner"
              />
            </div>

            {/* Input Lenguaje Natural */}
            <div>
              <label className="block text-xs font-semibold opacity-80 mb-1 text-white">
                ¿Cómo te fue en el entrenamiento? (Lenguaje Natural)
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="ej: Hoy completé los 8x200m entre 5:10 y 5:20/km con 1 min de caminata. Pulsaciones medias 154 bpm y cadencia 172 spm... (o pega fotos con Ctrl+V)"
                className="w-full bg-[var(--bg-color)] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent resize-none leading-relaxed"
              />
            </div>

            {/* Image Upload / Drop / Paste Zone */}
            <div>
              <label className="block text-xs font-semibold opacity-80 mb-1.5 flex items-center justify-between text-white">
                <span className="flex items-center gap-1.5">
                  <ClipboardPaste size={14} className="text-accent" />
                  📸 Pega (Ctrl + V) o Sube Fotos de tu Reloj
                </span>
                <span className="text-[10px] text-accent font-medium">Huawei • Strava • Garmin</span>
              </label>

              {/* Image Previews */}
              {selectedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedImages.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-accent/40 group shadow-md">
                      <img src={img} className="w-full h-full object-cover" alt={`Captura ${idx + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeImageAt(idx)}
                        className="absolute top-1 right-1 bg-black/80 text-white rounded-full p-0.5 hover:bg-red-500 transition cursor-pointer"
                        title="Eliminar imagen"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                multiple 
                className="hidden" 
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-4 px-3 rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center gap-1.5 text-xs font-medium cursor-pointer ${
                  isDragging
                    ? 'border-accent bg-accent/10 text-white'
                    : 'border-white/15 hover:border-accent hover:bg-white/5 text-white/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-accent" />
                  <span>{selectedImages.length > 0 ? '+ Agregar o pegar más capturas' : 'Haz clic, arrastra o pega (Ctrl + V) imágenes'}</span>
                </div>
                <p className="text-[10px] opacity-50">
                  Puedes copiar una captura de pantalla y presionar <strong>Ctrl + V</strong> en cualquier parte de este modal.
                </p>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                {errorMsg}
              </p>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-white/5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={processing}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5 transition cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={processing || (!description.trim() && selectedImages.length === 0)}
                className="px-5 py-2 rounded-xl bg-accent text-black text-xs font-bold hover:opacity-90 transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Procesando con Coach IA...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Guardar & Analizar con IA
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
