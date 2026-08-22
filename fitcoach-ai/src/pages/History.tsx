import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { supabase } from '../config/supabase';
import { api } from '../services/api';
import RegisterWorkoutModal from '../components/RegisterWorkoutModal';
import EditSessionModal from '../components/EditSessionModal';
import SessionDetailModal from '../components/SessionDetailModal';
import { 
  Activity, Sparkles, Trash2, Edit3, Eye
} from 'lucide-react';

interface TrainingSession {
  id: string;
  sport_type: 'running' | 'football' | 'gym' | 'walking' | 'cycling';
  title: string;
  description?: string;
  started_at: string;
  duration_seconds: number;
  distance_meters?: number;
  calories_burned?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  avg_pace_sec_per_km?: number;
  ai_analysis?: {
    summary?: string;
    pros?: string[];
    improvements?: string[];
    intensity_score?: number;
    aerobic_efficiency?: string;
    key_takeaways?: string[];
    recommendations?: string[];
    recovery_time_hours?: number;
  };
}

export default function History() {
  const { session } = useAuth();
  const { confirm: confirmModal, showAlert, showToast } = useModal();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDetailSession, setViewingDetailSession] = useState<TrainingSession | null>(null);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [filterSport, setFilterSport] = useState<string>('all');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchSessions = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [session]);

  const handleTriggerAIAnalysis = async (sessionItem: TrainingSession) => {
    setAnalyzingId(sessionItem.id);
    try {
      const res = await api.analyzeSession(sessionItem.id);
      if (res.analysis) {
        setSessions(prev => prev.map(s => s.id === sessionItem.id ? { ...s, ai_analysis: res.analysis } : s));
        if (viewingDetailSession?.id === sessionItem.id) {
          setViewingDetailSession(prev => prev ? { ...prev, ai_analysis: res.analysis } : null);
        }
        showToast('Evaluación del Coach IA generada exitosamente.');
      }
    } catch (err: any) {
      showAlert({
        title: 'Error de análisis',
        message: err.message || 'No se pudo generar la evaluación del Coach IA.',
        type: 'error',
      });
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleSyncHuawei = async () => {
    setSyncing(true);
    try {
      const res = await api.syncHuawei();
      await fetchSessions();
      showToast(res.message || 'Entrenamientos sincronizados desde Huawei Watch');
    } catch (err: any) {
      showAlert({
        title: 'Error de Sincronización',
        message: err.message || 'No se pudo sincronizar con Huawei Health.',
        type: 'error',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteSession = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    confirmModal({
      title: '¿Eliminar este entrenamiento?',
      message: 'Esta acción borrará el registro de tu historial deportivo permanentemente.',
      confirmText: 'Eliminar',
      variant: 'danger',
      icon: 'danger',
      onConfirm: async () => {
        try {
          await supabase.from('training_sessions').delete().eq('id', id);
          setSessions(prev => prev.filter(s => s.id !== id));
          if (viewingDetailSession?.id === id) {
            setViewingDetailSession(null);
          }
          showToast({ message: 'Sesión eliminada de tu historial.', type: 'info' });
        } catch (err: any) {
          showAlert({
            title: 'Error al eliminar',
            message: err.message || 'No se pudo eliminar la sesión.',
            type: 'error',
          });
        }
      }
    });
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

  const filteredSessions = filterSport === 'all' 
    ? sessions 
    : sessions.filter(s => s.sport_type === filterSport);

  return (
    <div className="space-y-6">
      
      {/* Header & Registration Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Historial de Entrenamientos</h1>
          <p className="opacity-60 text-sm">Registro de tus sesiones reales y análisis del Coach IA</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={handleSyncHuawei}
            disabled={syncing}
            className="bg-white/5 hover:bg-white/10 text-white/80 font-semibold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-white/10 disabled:opacity-50"
          >
            <Activity size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Consultando...' : 'Sincronizar Watch GT'}
          </button>
          
          <button 
            onClick={() => setIsRegisterModalOpen(true)}
            className="bg-accent text-black font-bold text-xs px-4 py-2 rounded-xl hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Sparkles size={14} /> + Registrar Entrenamiento (IA / Foto / Texto)
          </button>
        </div>
      </div>

      {/* Sport Category Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'running', label: '🏃 Running' },
          { id: 'football', label: '⚽ Fútbol' },
          { id: 'gym', label: '🏋️ Gym' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterSport(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterSport === tab.id 
                ? 'bg-accent text-black font-bold shadow-md' 
                : 'surface opacity-60 hover:opacity-100 hover:bg-white/10 border border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Container: Full Width Sessions List */}
      <div className="space-y-3.5 max-w-5xl mx-auto">
        {loading ? (
          <div className="surface p-8 rounded-3xl border border-white/5 text-center opacity-60">
            Cargando entrenamientos...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="surface p-12 rounded-3xl border border-white/5 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto opacity-70">
              <Activity size={32} />
            </div>
            <h3 className="text-lg font-semibold">No hay entrenamientos registrados aún</h3>
            <p className="text-sm opacity-60 max-w-md mx-auto">
              Registra tu primera sesión describiéndola en lenguaje natural o subiendo una foto/captura de pantalla de tu reloj.
            </p>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="bg-accent text-black font-bold text-xs px-4 py-2.5 rounded-xl hover:opacity-90 transition inline-flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Sparkles size={14} /> Registrar Mi Entrenamiento Ahora
            </button>
          </div>
        ) : (
          filteredSessions.map((s) => {
            return (
              <div 
                key={s.id}
                onClick={() => setViewingDetailSession(s)}
                className="surface p-5 sm:p-6 rounded-3xl border border-white/10 hover:border-white/20 transition cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-xl hover:bg-white/[0.02] group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                    s.sport_type === 'running' ? 'bg-amber-500/20 text-amber-400' :
                    s.sport_type === 'football' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {s.sport_type === 'running' ? '🏃' : s.sport_type === 'football' ? '⚽' : '🏋️'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold bg-accent/15 px-2 py-0.5 rounded-md text-accent uppercase tracking-wider">
                        {s.sport_type}
                      </span>
                      <span className="text-xs opacity-60">
                        {new Date(s.started_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mt-1 text-white group-hover:text-accent transition">
                      {s.title}
                    </h3>
                  </div>
                </div>

                {/* Metrics Badges + Action Buttons */}
                <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                  <div className="flex items-center gap-4 sm:gap-5 text-right text-xs">
                    <div>
                      <p className="font-bold text-white text-sm">{formatDuration(s.duration_seconds)}</p>
                      <p className="text-[10px] opacity-60">Tiempo</p>
                    </div>

                    {s.distance_meters ? (
                      <div>
                        <p className="font-bold text-cyan-400 text-sm">{(s.distance_meters / 1000).toFixed(2)} km</p>
                        <p className="text-[10px] opacity-60">Distancia</p>
                      </div>
                    ) : null}

                    {s.avg_pace_sec_per_km ? (
                      <div>
                        <p className="font-bold text-accent text-sm">{formatPace(s.avg_pace_sec_per_km)}</p>
                        <p className="text-[10px] opacity-60">Ritmo</p>
                      </div>
                    ) : null}

                    {s.avg_heart_rate ? (
                      <div>
                        <p className="font-bold text-red-400 text-sm">{s.avg_heart_rate} bpm</p>
                        <p className="text-[10px] opacity-60">FC Prom</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingDetailSession(s);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition flex items-center gap-1 border border-white/10"
                      title="Ver diagnóstico completo"
                    >
                      <Eye size={13} className="text-accent" />
                      <span className="hidden sm:inline">Ver Detalle</span>
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSession(s);
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 transition cursor-pointer border border-white/5"
                      title="Editar entrenamiento"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button 
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition cursor-pointer border border-white/5"
                      title="Eliminar sesión"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Inteligente de Registro con IA */}
      <RegisterWorkoutModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={(saved) => {
          setSessions(prev => [saved, ...prev]);
        }}
      />

      {/* Modal para Ver Detalle Completo de Sesión & Diagnóstico IA */}
      {viewingDetailSession && (
        <SessionDetailModal
          isOpen={true}
          session={viewingDetailSession}
          onClose={() => setViewingDetailSession(null)}
          onOpenEdit={() => {
            const target = viewingDetailSession;
            setViewingDetailSession(null);
            setEditingSession(target);
          }}
          onDelete={() => {
            const targetId = viewingDetailSession.id;
            handleDeleteSession(targetId);
          }}
          onReanalyze={() => handleTriggerAIAnalysis(viewingDetailSession)}
          isAnalyzing={analyzingId === viewingDetailSession.id}
        />
      )}

      {/* Modal para Editar Entrenamiento y Asociar con Plan */}
      {editingSession && (
        <EditSessionModal
          isOpen={true}
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSaved={(updated) => {
            setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
            if (viewingDetailSession?.id === updated.id) {
              setViewingDetailSession(updated);
            }
          }}
        />
      )}

    </div>
  );
}
