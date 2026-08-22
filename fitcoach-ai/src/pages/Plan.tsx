import { useState } from 'react';
import { usePlan, type TrainingDay, type PlanWeek } from '../contexts/PlanContext';
import { useModal } from '../contexts/ModalContext';
import { api } from '../services/api';
import RegisterWorkoutModal from '../components/RegisterWorkoutModal';
import DayDetailModal from '../components/DayDetailModal';
import { 
  Target, Sparkles, 
  Zap, Edit3, Plus, Trash2, X, Save, 
  RotateCcw, CheckCircle2, Circle, Eye
} from 'lucide-react';

export default function Plan() {
  const { 
    plan, 
    setPlan, 
    updateDay, 
    addDay, 
    deleteDay, 
    toggleDayCompletion, 
    toggleWeekCompletion, 
    resetToDefaultPlan 
  } = usePlan();

  const { confirm: confirmModal, showAlert, showToast } = useModal();
  
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);
  const [viewingDetailDay, setViewingDetailDay] = useState<{ day: TrainingDay; index: number } | null>(null);
  const [editingDay, setEditingDay] = useState<{ day: TrainingDay; index: number } | null>(null);
  const [registeringDay, setRegisteringDay] = useState<{ day: TrainingDay; index: number } | null>(null);
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state para estructurar el entrenamiento por bloques
  const [formDayName, setFormDayName] = useState('Día 1: Martes');
  const [formSport, setFormSport] = useState<'running' | 'football' | 'gym' | 'rest'>('running');
  const [formTitle, setFormTitle] = useState('');
  const [formObjective, setFormObjective] = useState('');
  const [formWarmup, setFormWarmup] = useState('');
  const [formMainBlock, setFormMainBlock] = useState('');
  const [formRecovery, setFormRecovery] = useState('');
  const [formCooldown, setFormCooldown] = useState('');
  const [formTechnicalFocus, setFormTechnicalFocus] = useState('');
  const [formDistance, setFormDistance] = useState<string>('');
  const [formDuration, setFormDuration] = useState<string>('');
  const [formPace, setFormPace] = useState('');
  const [formHrZone, setFormHrZone] = useState('');
  const [formNutrition, setFormNutrition] = useState('');

  const currentWeekData = plan.weeks.find((w: PlanWeek) => w.week_number === selectedWeekNum) || plan.weeks[0];

  // Cálculo de progreso del ciclo de 6 semanas
  const completedWeeks = plan.weeks.filter(w => w.completed || (w.days && w.days.length > 0 && w.days.every(d => d.completed))).length;
  const remainingWeeks = Math.max(0, (plan.weeks_count || 6) - completedWeeks);
  const progressPercent = Math.round((completedWeeks / (plan.weeks_count || 6)) * 100);

  const handleOpenEditModal = (day: TrainingDay, index: number) => {
    setEditingDay({ day, index });
    setIsAddingDay(false);
    setFormDayName(day.day_name || 'Día ' + (index + 1));
    setFormSport(day.sport);
    setFormTitle(day.title);
    setFormObjective(day.objective || '');
    setFormWarmup(day.warmup || '');
    setFormMainBlock(day.main_block || day.description || '');
    setFormRecovery(day.recovery || '');
    setFormCooldown(day.cooldown || '');
    setFormTechnicalFocus(day.technical_focus || '');
    setFormDistance(day.target_distance_km ? String(day.target_distance_km) : '');
    setFormDuration(day.target_duration_min ? String(day.target_duration_min) : '');
    setFormPace(day.target_pace || '');
    setFormHrZone(day.target_hr_zone || '');
    setFormNutrition(day.nutrition_tip || '');
  };

  const handleOpenAddModal = () => {
    setIsAddingDay(true);
    setEditingDay(null);
    setFormDayName(`Día ${(currentWeekData?.days?.length || 0) + 1}`);
    setFormSport('running');
    setFormTitle('Intervalos de Velocidad');
    setFormObjective('Estimular el sistema neuromuscular y mejorar velocidad tope.');
    setFormWarmup('10 min trote suave (Zona 2, 115-133 ppm).');
    setFormMainBlock('8 repeticiones de 200m a ritmo entre 5:00 y 5:25 /km.');
    setFormRecovery('1 min caminata activa entre repeticiones (<115 ppm).');
    setFormCooldown('3 a 5 min de caminata suave a Zona 2.');
    setFormTechnicalFocus('Cadencia ~160 spm y pasos cortos.');
    setFormDistance('4.5');
    setFormDuration('35');
    setFormPace('5:00 - 5:25 /km');
    setFormHrZone('Zona 4-5 en series');
    setFormNutrition('500ml agua con sales 30 min antes.');
  };

  const handleSaveDayForm = (e: React.FormEvent) => {
    e.preventDefault();
    const newDayData: TrainingDay = {
      day_name: formDayName,
      sport: formSport,
      title: formTitle,
      objective: formObjective || undefined,
      warmup: formWarmup || undefined,
      main_block: formMainBlock || undefined,
      recovery: formRecovery || undefined,
      cooldown: formCooldown || undefined,
      technical_focus: formTechnicalFocus || undefined,
      description: formMainBlock || formObjective || 'Sesión programada',
      target_distance_km: formDistance || undefined,
      target_duration_min: formDuration || undefined,
      target_pace: formPace || undefined,
      target_hr_zone: formHrZone || undefined,
      nutrition_tip: formNutrition || undefined,
      completed: editingDay?.day?.completed || false,
    };

    if (isAddingDay) {
      addDay(selectedWeekNum, newDayData);
      setIsAddingDay(false);
      showToast('Día añadido al plan.');
    } else if (editingDay !== null) {
      updateDay(selectedWeekNum, editingDay.index, newDayData);
      setEditingDay(null);
      showToast('Entrenamiento actualizado.');
    }
  };

  const handleResetToOfficialPlan = () => {
    confirmModal({
      title: '¿Restablecer al Ciclo Oficial de 6 Semanas?',
      message: 'Esta acción cargará tus 4 entrenamientos estructurados hacia 4:30/km y reiniciará el macrociclo de 6 semanas.',
      confirmText: 'Restablecer Plan',
      icon: 'warning',
      variant: 'accent',
      onConfirm: () => {
        resetToDefaultPlan();
        setSelectedWeekNum(1);
        showToast('Plan restablecido al ciclo oficial de 6 semanas.');
      }
    });
  };

  const handleGeneratePlanWithAI = () => {
    confirmModal({
      title: '¿Regenerar Plan con Coach IA?',
      message: 'El Coach IA optimizará tu ciclo de 6 semanas con periodización avanzada por bloques (Calentamiento, Bloque Principal, Recuperación y Enfriamiento).',
      confirmText: 'Generar con IA',
      icon: 'info',
      variant: 'accent',
      onConfirm: async () => {
        setGenerating(true);
        try {
          const response = await api.generatePlan('Plan periodizado de 6 semanas estructurado por bloques hacia ritmo 4:30 min/km', 6, 4);
          if (response.plan) {
            setPlan(response.plan);
            showToast('¡Nuevo ciclo de 6 semanas generado con éxito por tu Coach IA!');
          }
        } catch (err: any) {
          showAlert({
            title: 'Error al generar el plan',
            message: err.message || 'No se pudo conectar con el Coach IA.',
            type: 'error',
          });
        } finally {
          setGenerating(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Goal Banner */}
      <div className="surface p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold">
            <Target size={13} />
            Ciclo Macro de 6 Semanas (Objetivo: 4:30 min/km)
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {plan.title}
          </h1>
          <p className="text-xs md:text-sm opacity-70 leading-relaxed">
            Plan periodizado estructurado en <strong>4 fases fijas de 6 semanas</strong>. Puedes registrar tus sesiones en lenguaje natural o con fotos de tu reloj para ver tu diagnóstico técnico con pros y aspectos a mejorar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 z-10">
          <button
            onClick={handleResetToOfficialPlan}
            className="surface hover:bg-white/10 text-white/80 font-semibold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-white/10 cursor-pointer"
            title="Restablecer al ciclo oficial de 6 semanas"
          >
            <RotateCcw size={13} />
            Restablecer Plan (6 Semanas)
          </button>
          
          <button
            onClick={handleGeneratePlanWithAI}
            disabled={generating}
            className="bg-accent text-black font-bold text-xs px-4 py-2 rounded-xl hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
          >
            <Sparkles size={14} />
            {generating ? 'Optimizando...' : 'Reajustar con Coach IA'}
          </button>
        </div>
      </div>

      {/* Progress & Remaining Weeks Tracker */}
      <div className="surface p-5 rounded-2xl border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold text-sm">
              {completedWeeks}/6
            </span>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                Progreso del Ciclo: {completedWeeks} de 6 Semanas Realizadas
                {completedWeeks > 0 && (
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {remainingWeeks} {remainingWeeks === 1 ? 'semana restante' : 'semanas restantes'}
                  </span>
                )}
              </h3>
              <p className="text-xs opacity-60">
                {remainingWeeks === 0 
                  ? '🎉 ¡Ciclo de 6 semanas completado con éxito! Listo para el test oficial.' 
                  : `Completando esta fase te restan ${remainingWeeks} semanas para el test oficial de 4:30 min/km.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleWeekCompletion(selectedWeekNum)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border shrink-0 ${
              currentWeekData?.completed 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' 
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/15'
            }`}
          >
            <CheckCircle2 size={14} className={currentWeekData?.completed ? 'text-emerald-400' : 'opacity-40'} />
            {currentWeekData?.completed ? `Semana ${selectedWeekNum} Completada ✅` : `Marcar Semana ${selectedWeekNum} como Realizada`}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-accent h-full transition-all duration-500 rounded-full"
            style={{ width: `${Math.max(progressPercent, 5)}%` }}
          />
        </div>
      </div>

      {/* 4 Phases Timeline (6 Weeks) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {plan.phases.map((phase: any, idx: number) => {
          const isCurrent = (selectedWeekNum <= 2 && phase.phase === 1) ||
                            (selectedWeekNum >= 3 && selectedWeekNum <= 4 && phase.phase === 2) ||
                            (selectedWeekNum === 5 && phase.phase === 3) ||
                            (selectedWeekNum === 6 && phase.phase === 4);

          return (
            <div 
              key={idx}
              className={`p-4 rounded-2xl border transition ${
                isCurrent 
                  ? 'bg-accent/10 border-accent/40 ring-1 ring-accent/30' 
                  : 'surface border-white/5 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xl">{phase.icon || '🏃'}</span>
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">{phase.weeks}</span>
              </div>
              <h3 className="font-bold text-xs leading-tight">{phase.name}</h3>
            </div>
          );
        })}
      </div>

      {/* Week Tabs Horizontal Selector (Weeks 1 to 6) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {plan.weeks.map((w: PlanWeek) => {
          const weekNum = w.week_number;
          const isSelected = selectedWeekNum === weekNum;
          const isWeekDone = w.completed || (w.days && w.days.length > 0 && w.days.every(d => d.completed));

          return (
            <button
              key={weekNum}
              onClick={() => setSelectedWeekNum(weekNum)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                isSelected 
                  ? 'bg-accent text-black font-bold shadow-md' 
                  : 'surface hover:bg-white/10 opacity-70 hover:opacity-100 border border-white/5'
              }`}
            >
              {isWeekDone && <CheckCircle2 size={12} className={isSelected ? 'text-black' : 'text-emerald-400'} />}
              Semana {weekNum} {weekNum === 1 ? '(Actual)' : ''}
            </button>
          );
        })}
      </div>

      {/* Week Focus Bar + Add Day Button */}
      <div className="surface p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <Zap size={18} className="text-accent shrink-0" />
          <p className="text-xs sm:text-sm font-medium">
            <span className="text-accent font-bold">Foco de la Semana {selectedWeekNum}:</span> {currentWeekData?.focus || 'Desarrollo de resistencia y técnica de carrera.'}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus size={14} /> Añadir Día
        </button>
      </div>

      {/* Main Container: Full Width Days of Week */}
      <div className="space-y-3.5 max-w-5xl mx-auto">
        {currentWeekData?.days?.map((day: TrainingDay, index: number) => {
          const sportEmoji = {
            running: '🏃',
            football: '⚽',
            gym: '🏋️',
            rest: '🧘'
          }[day.sport] || '🏃';

          return (
            <div
              key={index}
              onClick={() => setViewingDetailDay({ day, index })}
              className={`surface p-5 sm:p-6 rounded-3xl border transition cursor-pointer flex flex-col justify-between gap-4 group hover:shadow-xl hover:border-white/20 ${
                day.completed 
                  ? 'border-emerald-500/30 bg-emerald-500/[0.03]' 
                  : 'border-white/10 hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5 flex-1">
                  {/* Checkbox de completado */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDayCompletion(selectedWeekNum, index);
                    }}
                    className="p-1 text-white/40 hover:text-emerald-400 transition cursor-pointer shrink-0 mt-0.5 sm:mt-0"
                    title={day.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                  >
                    {day.completed ? (
                      <CheckCircle2 size={22} className="text-emerald-400" />
                    ) : (
                      <Circle size={22} className="opacity-40 hover:opacity-100" />
                    )}
                  </button>

                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                    day.sport === 'running' ? 'bg-amber-500/20 text-amber-400' :
                    day.sport === 'football' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {sportEmoji}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold bg-accent/15 px-2.5 py-0.5 rounded-md text-accent uppercase tracking-wider">
                        {day.day_name}
                      </span>
                      <span className="text-xs font-semibold opacity-50 uppercase">
                        {day.sport}
                      </span>
                      {day.completed && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          Completado ✅
                        </span>
                      )}
                    </div>
                    <h3 className={`font-bold text-base sm:text-lg mt-1 text-white group-hover:text-accent transition ${day.completed ? 'opacity-80' : ''}`}>
                      {day.title}
                    </h3>
                    {day.objective && (
                      <p className="text-xs opacity-65 mt-1 line-clamp-1">{day.objective}</p>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Botón Ver Detalle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingDetailDay({ day, index });
                    }}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer font-semibold text-xs flex items-center gap-1.5 border border-white/10"
                    title="Ver detalle completo de la sesión"
                  >
                    <Eye size={14} className="text-accent" />
                    <span>Ver Detalle</span>
                  </button>

                  {/* Botón Registrar Sesión con IA */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRegisteringDay({ day, index });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-accent text-black hover:opacity-90 transition cursor-pointer font-extrabold text-xs flex items-center gap-1.5 shadow-md"
                    title="Registrar cómo te fue en este entrenamiento (Foto / Texto)"
                  >
                    <Sparkles size={14} />
                    <span>Registrar</span>
                  </button>

                  {/* Botón Editar Actividad */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(day, index);
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 transition cursor-pointer text-white/70 border border-white/5"
                    title="Editar parámetros del entrenamiento"
                  >
                    <Edit3 size={14} />
                  </button>

                  {/* Botón Eliminar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmModal({
                        title: '¿Eliminar sesión de entrenamiento?',
                        message: `¿Estás seguro de que deseas eliminar la sesión de ${day.day_name} (${day.title})?`,
                        confirmText: 'Eliminar',
                        variant: 'danger',
                        icon: 'danger',
                        onConfirm: () => {
                          deleteDay(selectedWeekNum, index);
                          showToast({ message: 'Sesión eliminada del plan.', type: 'info' });
                        }
                      });
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition cursor-pointer text-white/40 border border-white/5"
                    title="Eliminar día"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Micro blocks summary preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-2 border-t border-white/5">
                {day.main_block && (
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 sm:col-span-2">
                    <span className="font-bold text-accent text-[10px] block uppercase tracking-wider">Bloque Principal:</span>
                    <span className="opacity-85 line-clamp-1 font-medium">{day.main_block}</span>
                  </div>
                )}
                {day.target_pace && (
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="font-bold text-accent text-[10px] uppercase">Ritmo Meta:</span>
                    <span className="font-bold text-white text-xs">{day.target_pace}</span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal Inteligente de Registro de Entrenamiento Realizado */}
      {registeringDay && (
        <RegisterWorkoutModal
          isOpen={true}
          defaultTitle={registeringDay.day.title}
          targetDayName={registeringDay.day.day_name}
          initialWeekNum={selectedWeekNum}
          initialDayIndex={registeringDay.index}
          onClose={() => setRegisteringDay(null)}
          onSuccess={() => {
            if (!registeringDay.day.completed) {
              toggleDayCompletion(selectedWeekNum, registeringDay.index);
            }
          }}
        />
      )}

      {/* Modal Interactivo para Editar o Añadir un Día con Bloques Estructurados */}
      {(editingDay !== null || isAddingDay) && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setEditingDay(null); setIsAddingDay(false); }}
        >
          <form 
            onSubmit={handleSaveDayForm}
            onClick={(e) => e.stopPropagation()}
            className="surface border border-white/15 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Edit3 size={18} className="text-accent" />
                {isAddingDay ? 'Añadir Día de Entrenamiento' : `Editar ${formDayName}`}
              </h2>
              <button 
                type="button" 
                onClick={() => { setEditingDay(null); setIsAddingDay(false); }}
                className="p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs opacity-70 mb-1 font-semibold">Día de la Semana / Nombre</label>
                <input 
                  type="text" 
                  value={formDayName}
                  onChange={(e) => setFormDayName(e.target.value)}
                  placeholder="Día 1: Martes"
                  required
                  className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs opacity-70 mb-1 font-semibold">Deporte / Disciplina</label>
                <select
                  value={formSport}
                  onChange={(e) => setFormSport(e.target.value as any)}
                  className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="running">🏃 Running</option>
                  <option value="football">⚽ Fútbol</option>
                  <option value="gym">🏋️ Gym / Fuerza</option>
                  <option value="rest">🧘 Descanso Activo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs opacity-70 mb-1 font-semibold">Título de la Sesión</label>
              <input 
                type="text" 
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="ej: Intervalos Cortos (VO₂ max & Velocidad)"
                required
                className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
              />
            </div>

            {/* Objetivo */}
            <div>
              <label className="block text-xs opacity-70 mb-1 font-semibold">🎯 Objetivo Fisiológico</label>
              <textarea 
                value={formObjective}
                onChange={(e) => setFormObjective(e.target.value)}
                rows={2}
                placeholder="ej: Estimular sistema neuromuscular para correr rápido y procesar más oxígeno..."
                className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent resize-none"
              />
            </div>

            {/* Calentamiento & Bloque Principal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs opacity-70 mb-1 font-semibold">🔥 Calentamiento</label>
                <textarea 
                  value={formWarmup}
                  onChange={(e) => setFormWarmup(e.target.value)}
                  rows={2}
                  placeholder="ej: 10 min trote suave (Zona 2, 115-133 ppm)..."
                  className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs opacity-70 mb-1 font-semibold">⚡ Bloque Principal (Series/Tempo/Fondo)</label>
                <textarea 
                  value={formMainBlock}
                  onChange={(e) => setFormMainBlock(e.target.value)}
                  rows={2}
                  placeholder="ej: 8 repeticiones de 200m a ritmo entre 5:00 y 5:25 /km..."
                  required
                  className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent resize-none font-medium"
                />
              </div>
            </div>

            {/* Recuperación & Enfriamiento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs opacity-70 mb-1 font-semibold">🚶 Recuperación entre series</label>
                <input 
                  type="text" 
                  value={formRecovery}
                  onChange={(e) => setFormRecovery(e.target.value)}
                  placeholder="ej: 1 min caminata activa (<115 ppm)"
                  className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs opacity-70 mb-1 font-semibold">❄️ Enfriamiento</label>
                <input 
                  type="text" 
                  value={formCooldown}
                  onChange={(e) => setFormCooldown(e.target.value)}
                  placeholder="ej: 3 a 5 min caminata suave"
                  className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Enfoque Técnico & Cadencia */}
            <div>
              <label className="block text-xs opacity-70 mb-1 font-semibold">⚙️ Enfoque Técnico / Cadencia / Regla de Oro</label>
              <input 
                type="text" 
                value={formTechnicalFocus}
                onChange={(e) => setFormTechnicalFocus(e.target.value)}
                placeholder="ej: Cadencia ~160 spm, pasos cortos y sin acelerar"
                className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
              />
            </div>

            {/* Ritmo y Pulsaciones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs opacity-70 mb-1 font-semibold">Ritmo Objetivo (Pace)</label>
                <input 
                  type="text" 
                  value={formPace}
                  onChange={(e) => setFormPace(e.target.value)}
                  placeholder="5:00 - 5:25 /km"
                  className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs opacity-70 mb-1 font-semibold">Zona de Frecuencia Cardíaca</label>
                <input 
                  type="text" 
                  value={formHrZone}
                  onChange={(e) => setFormHrZone(e.target.value)}
                  placeholder="Zona 2 (115-133 ppm)"
                  className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Nutrición */}
            <div>
              <label className="block text-xs opacity-70 mb-1 font-semibold">🥤 Pauta de Nutrición / Hidratación</label>
              <input 
                type="text" 
                value={formNutrition}
                onChange={(e) => setFormNutrition(e.target.value)}
                placeholder="ej: 500ml agua con sales minerales 30 min antes"
                className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent"
              />
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setEditingDay(null); setIsAddingDay(false); }}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-accent text-black text-xs font-bold hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Save size={14} /> Guardar Entrenamiento
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Modal Grande de Detalle de Día Estructurado */}
      {viewingDetailDay && (
        <DayDetailModal
          isOpen={true}
          day={viewingDetailDay.day}
          weekNumber={selectedWeekNum}
          dayIndex={viewingDetailDay.index}
          onClose={() => setViewingDetailDay(null)}
          onToggleComplete={() => {
            toggleDayCompletion(selectedWeekNum, viewingDetailDay.index);
            // Actualizar la referencia local
            setViewingDetailDay(prev => prev ? { ...prev, day: { ...prev.day, completed: !prev.day.completed } } : null);
          }}
          onOpenRegister={() => {
            const target = viewingDetailDay;
            setViewingDetailDay(null);
            setRegisteringDay(target);
          }}
          onOpenEdit={() => {
            const target = viewingDetailDay;
            setViewingDetailDay(null);
            handleOpenEditModal(target.day, target.index);
          }}
          onDelete={() => {
            const target = viewingDetailDay;
            setViewingDetailDay(null);
            confirmModal({
              title: '¿Eliminar sesión de entrenamiento?',
              message: `¿Estás seguro de que deseas eliminar la sesión de ${target.day.day_name} (${target.day.title})?`,
              confirmText: 'Eliminar',
              variant: 'danger',
              icon: 'danger',
              onConfirm: () => {
                deleteDay(selectedWeekNum, target.index);
                showToast({ message: 'Sesión eliminada del plan.', type: 'info' });
              }
            });
          }}
        />
      )}

    </div>
  );
}
