import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { supabase } from '../config/supabase';
import { api } from '../services/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { Bot, Sparkles, Activity, Flame, Heart, Timer, ArrowUpRight, Watch, Plus } from 'lucide-react';

export default function Dashboard() {
  const { session } = useAuth();
  const { showAlert, showToast } = useModal();
  const [totalKm, setTotalKm] = useState('0.0');
  const [avgPace, setAvgPace] = useState('-- /km');
  const [avgHr, setAvgHr] = useState('-- bpm');
  const [totalCalories, setTotalCalories] = useState('0 kcal');
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [paceHrData, setPaceHrData] = useState<any[]>([]);
  
  // Huawei State
  const [huaweiConnected, setHuaweiConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadDashboardData = async () => {
    if (!session?.user?.id) return;
    try {
      // 1. Cargar estado de conexión de Huawei
      const statusRes = await api.getHuaweiStatus();
      if (statusRes && statusRes.connected) {
        setHuaweiConnected(true);
        localStorage.setItem('huawei_connected', 'true');
      } else {
        const localConnected = localStorage.getItem('huawei_connected') === 'true';
        setHuaweiConnected(localConnected);
      }

      // 2. Cargar sesiones reales de Supabase
      const { data: sessions, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;

      if (sessions && sessions.length > 0) {
        setRecentWorkouts(sessions.slice(0, 4));

        // Calcular total Km
        const totalDistanceM = sessions.reduce((acc, s) => acc + (s.distance_meters || 0), 0);
        setTotalKm((totalDistanceM / 1000).toFixed(1));

        // Calcular calorías
        const totalCal = sessions.reduce((acc, s) => acc + (s.calories_burned || 0), 0);
        setTotalCalories(`${totalCal} kcal`);

        // Calcular Ritmo Promedio ponderado
        const sessionsWithPace = sessions.filter(s => s.avg_pace_sec_per_km && s.avg_pace_sec_per_km > 0);
        if (sessionsWithPace.length > 0) {
          const avgSec = Math.round(sessionsWithPace.reduce((acc, s) => acc + s.avg_pace_sec_per_km, 0) / sessionsWithPace.length);
          const mins = Math.floor(avgSec / 60);
          const secs = avgSec % 60;
          setAvgPace(`${mins}:${secs < 10 ? '0' : ''}${secs} /km`);
        } else {
          setAvgPace('-- /km');
        }

        // Calcular FC Promedio
        const sessionsWithHr = sessions.filter(s => s.avg_heart_rate && s.avg_heart_rate > 0);
        if (sessionsWithHr.length > 0) {
          const avgHeart = Math.round(sessionsWithHr.reduce((acc, s) => acc + s.avg_heart_rate, 0) / sessionsWithHr.length);
          setAvgHr(`${avgHeart} bpm`);
        } else {
          setAvgHr('-- bpm');
        }

        // Generar puntos para gráfico Pace vs HR
        const paceHrPoints = sessions
          .slice(0, 6)
          .reverse()
          .map((s, idx) => ({
            sesion: `S${idx + 1}`,
            date: new Date(s.started_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            pace: s.avg_pace_sec_per_km ? Number((s.avg_pace_sec_per_km / 60).toFixed(2)) : null,
            hr: s.avg_heart_rate || null,
          }));
        setPaceHrData(paceHrPoints);

        // Agrupar volumen semanal
        const daysMap: Record<string, number> = { 'Lun': 0, 'Mar': 0, 'Mié': 0, 'Jue': 0, 'Vie': 0, 'Sáb': 0, 'Dom': 0 };
        sessions.forEach(s => {
          const d = new Date(s.started_at);
          const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          const dayKey = dayNames[d.getDay()];
          if (daysMap[dayKey] !== undefined) {
            daysMap[dayKey] += (s.distance_meters || 0) / 1000;
          }
        });

        const weeklyChartPoints = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => ({
          day,
          km: Number(daysMap[day].toFixed(1)),
        }));
        setWeeklyData(weeklyChartPoints);

      } else {
        // Datos por defecto limpios sin mocks
        setTotalKm('0.0');
        setAvgPace('-- /km');
        setAvgHr('-- bpm');
        setTotalCalories('0 kcal');
        setRecentWorkouts([]);
        setWeeklyData([
          { day: 'Lun', km: 0 },
          { day: 'Mar', km: 0 },
          { day: 'Mié', km: 0 },
          { day: 'Jue', km: 0 },
          { day: 'Vie', km: 0 },
          { day: 'Sáb', km: 0 },
          { day: 'Dom', km: 0 },
        ]);
        setPaceHrData([]);
      }
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [session]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await api.syncHuawei();
      setHuaweiConnected(true);
      localStorage.setItem('huawei_connected', 'true');
      showToast('Datos de Huawei Watch sincronizados.');
      await loadDashboardData();
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

  const userName = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'Freddy';

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="surface p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold">
            <Sparkles size={13} />
            Tu Asistente Deportivo Listo
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            ¡Hola, {userName}! 🏃‍♂️⚽
          </h1>
          <p className="text-sm opacity-70 leading-relaxed">
            Tu Coach IA está listo para evaluar tus ritmos hacia el objetivo de 4:30 min/km. Registra tus carreras en lenguaje natural o con fotos de tu reloj.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 z-10">
          <Link 
            to="/chat" 
            className="bg-accent text-black font-bold text-xs px-4 py-2.5 rounded-xl hover:opacity-90 transition flex items-center gap-2 shadow-lg"
          >
            <Bot size={16} />
            Hablar con Coach IA
          </Link>

          <button 
            onClick={handleManualSync}
            disabled={syncing}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 border cursor-pointer disabled:opacity-50 ${
              huaweiConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                : 'surface border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${huaweiConnected ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'}`} />
            {syncing 
              ? 'Sincronizando Reloj...' 
              : huaweiConnected 
                ? 'Huawei Watch GT Pro 6 (Sincronizar)' 
                : 'Conectar Huawei Watch'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Distancia Registrada', value: `${totalKm} km`, icon: Activity, change: 'Total acumulado', color: 'text-cyan-400' },
          { label: 'Ritmo Promedio', value: avgPace, icon: Timer, change: 'Objetivo: 4:30 /km', color: 'text-accent' },
          { label: 'FC Promedio', value: avgHr, icon: Heart, change: 'Zona 2-3 de esfuerzo', color: 'text-red-400' },
          { label: 'Calorías Quemadas', value: totalCalories, icon: Flame, change: 'Gasto energético real', color: 'text-amber-400' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="surface p-5 rounded-2xl border border-white/5 space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium opacity-60">{stat.label}</span>
                <div className={`p-2 rounded-xl bg-white/5 ${stat.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-[11px] opacity-50 mt-1">{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Volume Chart */}
        <div className="surface p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Volumen Semanal de Kilómetros</h2>
              <p className="text-xs opacity-60">Distancia acumulada por día</p>
            </div>
            <span className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-lg">
              {totalKm} km
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} unit="km" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="km" fill="var(--accent-color)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pace vs HR Chart */}
        <div className="surface p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Evolución de Ritmo (min/km) vs Pulso</h2>
              <p className="text-xs opacity-60">Eficiencia cardiovascular en las últimas sesiones</p>
            </div>
            <span className="text-xs font-semibold opacity-60">
              Meta: 4:30 /km
            </span>
          </div>

          <div className="h-64 w-full relative">
            {paceHrData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-2xl space-y-2">
                <Activity size={28} className="opacity-40 text-accent" />
                <p className="text-xs opacity-60 max-w-xs">
                  Sin sesiones registradas aún. Registra tu primera carrera para ver cómo evoluciona tu ritmo vs pulso cardíaco.
                </p>
                <Link to="/plan" className="text-xs font-bold text-accent hover:underline inline-flex items-center gap-1">
                  <Plus size={12} /> Ir al Plan y Registrar
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paceHrData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="sesion" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <YAxis yAxisId="left" stroke="var(--accent-color)" fontSize={12} domain={['auto', 'auto']} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f87171" fontSize={12} unit="bpm" />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="pace" stroke="var(--accent-color)" strokeWidth={3} dot={{ r: 4 }} name="Ritmo (min/km)" />
                  <Line yAxisId="right" type="monotone" dataKey="hr" stroke="#f87171" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} name="Frecuencia (bpm)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Recent Workouts List */}
      <div className="surface p-6 rounded-3xl border border-white/5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Watch size={18} className="text-accent" />
            <h2 className="text-lg font-bold">Últimos Entrenamientos Sincronizados</h2>
          </div>
          <Link to="/history" className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold">
            Ver todos en Historial <ArrowUpRight size={14} />
          </Link>
        </div>

        {recentWorkouts.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center space-y-2">
            <p className="text-xs opacity-60">No hay entrenamientos recientes registrados en la base de datos.</p>
            <Link 
              to="/plan" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/15 text-accent font-bold text-xs hover:bg-accent hover:text-black transition"
            >
              <Plus size={13} /> Registrar Primera Sesión en el Plan
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentWorkouts.map((w) => {
              const distanceKm = w.distance_meters ? (Number(w.distance_meters) / 1000).toFixed(2) : '0';
              const durationMin = w.duration_seconds ? Math.round(Number(w.duration_seconds) / 60) : 0;
              
              let paceFormatted = 'N/A';
              if (w.avg_pace_sec_per_km) {
                const mins = Math.floor(w.avg_pace_sec_per_km / 60);
                const secs = Math.round(w.avg_pace_sec_per_km % 60);
                paceFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs} /km`;
              }

              const dateStr = new Date(w.started_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={w.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-white/15 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      w.sport_type === 'running' ? 'bg-amber-500/20 text-amber-400' :
                      w.sport_type === 'football' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {w.sport_type === 'running' ? '🏃' : w.sport_type === 'football' ? '⚽' : '🏋️'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{w.title}</h3>
                      <p className="text-xs opacity-50">{dateStr} • {w.sport_type.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center text-xs">
                    <div className="text-right">
                      <p className="font-bold">{distanceKm} km</p>
                      <p className="text-[10px] opacity-50">{durationMin} min</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent">{paceFormatted}</p>
                      <p className="text-[10px] opacity-50">{w.avg_heart_rate ? `${w.avg_heart_rate} bpm` : 'Sin FC'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
