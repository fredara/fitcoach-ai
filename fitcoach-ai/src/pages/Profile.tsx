import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { supabase } from '../config/supabase';
import { api } from '../services/api';
import { User, Shield, Check, Save, Watch, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Smartphone } from 'lucide-react';

export default function Profile() {
  const { session } = useAuth();
  const { confirm: confirmModal, showAlert, showToast } = useModal();
  const [currentTheme, setCurrentTheme] = useState(document.documentElement.getAttribute('data-theme') || 'dark');
  const [displayName, setDisplayName] = useState(session?.user?.user_metadata?.full_name || '');
  const [fitnessLevel, setFitnessLevel] = useState('intermediate');
  const [weightKg, setWeightKg] = useState<number | ''>(70);
  const [heightCm, setHeightCm] = useState<number | ''>(175);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Huawei Health State
  const [huaweiConnected, setHuaweiConnected] = useState(() => {
    return localStorage.getItem('huawei_connected') === 'true';
  });
  const [huaweiLoading, setHuaweiLoading] = useState(false);
  const [huaweiSyncing, setHuaweiSyncing] = useState(false);
  const [huaweiMsg, setHuaweiMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('huawei_connected') === 'true') {
      setHuaweiConnected(true);
      localStorage.setItem('huawei_connected', 'true');
      setHuaweiMsg('✅ ¡Huawei Health Kit conectado exitosamente con tu cuenta!');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('huawei_error')) {
      const err = params.get('huawei_error');
      const desc = params.get('huawei_desc') ? ` - ${params.get('huawei_desc')}` : '';
      const sub = params.get('huawei_sub') ? ` (Sub-código: ${params.get('huawei_sub')})` : '';
      setHuaweiMsg(`❌ Error conectando Huawei: ${err}${desc}${sub}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    async function loadProfile() {
      if (!session?.user?.id) return;
      try {
        // Verificar estado backend de Huawei
        const statusRes = await api.getHuaweiStatus().catch(() => ({ connected: false }));
        if (statusRes.connected) {
          setHuaweiConnected(true);
          localStorage.setItem('huawei_connected', 'true');
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!error && data) {
          if (data.display_name) setDisplayName(data.display_name);
          if (data.fitness_level) setFitnessLevel(data.fitness_level);
          if (data.weight_kg) setWeightKg(data.weight_kg);
          if (data.height_cm) setHeightCm(data.height_cm);
          if (data.preferred_theme) {
            document.documentElement.setAttribute('data-theme', data.preferred_theme);
            setCurrentTheme(data.preferred_theme);
          }
        }
      } catch (err) {
        console.error('Error al cargar perfil:', err);
      }
    }
    loadProfile();
  }, [session]);

  const handleConnectHuawei = async () => {
    setHuaweiLoading(true);
    setHuaweiMsg(null);
    try {
      const { authUrl } = await api.getHuaweiAuthUrl();
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error('No se recibió la URL de autorización');
      }
    } catch (err: any) {
      setHuaweiMsg(`❌ Error al iniciar conexión: ${err.message}`);
      setHuaweiLoading(false);
    }
  };

  const handleSyncDataNow = async () => {
    setHuaweiSyncing(true);
    setHuaweiMsg(null);
    try {
      const res = await api.syncHuawei();
      setHuaweiMsg(`✅ Sincronización exitosa: ${res.message || 'Datos del reloj actualizados'}`);
      showToast('Datos de Huawei Health sincronizados.');
    } catch (err: any) {
      setHuaweiMsg(`❌ Error al sincronizar: ${err.message}`);
      showAlert({
        title: 'Error de Sincronización',
        message: err.message || 'No se pudieron sincronizar los datos de Huawei.',
        type: 'error',
      });
    } finally {
      setHuaweiSyncing(false);
    }
  };

  const handleDisconnectHuawei = () => {
    confirmModal({
      title: '¿Desconectar Huawei Watch GT Pro 6?',
      message: 'Se desvinculará el reloj de tu perfil. Podrás volver a conectarlo cuando desees.',
      confirmText: 'Desconectar Reloj',
      variant: 'danger',
      icon: 'warning',
      onConfirm: () => {
        setHuaweiConnected(false);
        localStorage.removeItem('huawei_connected');
        setHuaweiMsg('Reloj desconectado.');
        showToast('Reloj Huawei desconectado.');
      }
    });
  };

  const handleThemeChange = async (themeName: string) => {
    document.documentElement.setAttribute('data-theme', themeName);
    setCurrentTheme(themeName);
    if (session?.user?.id) {
      await supabase.from('profiles').update({ preferred_theme: themeName }).eq('id', session.user.id);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          display_name: displayName,
          fitness_level: fitnessLevel,
          weight_kg: weightKg === '' ? null : Number(weightKg),
          height_cm: heightCm === '' ? null : Number(heightCm),
          preferred_theme: currentTheme,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setSaveSuccess(true);
      showToast('Perfil guardado exitosamente.');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      showAlert({
        title: 'Error al guardar perfil',
        message: err.message || 'No se pudieron guardar los cambios.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const themes = [
    { id: 'amoled', name: '🖤 AMOLED', color: '#000000', border: '#22d3ee' },
    { id: 'dark', name: '🌑 Dark Gray', color: '#111113', border: '#60a5fa' },
    { id: 'night', name: '🌙 Night Blue', color: '#0b1120', border: '#818cf8' },
    { id: 'forest', name: '🌲 Forest', color: '#0a1a0f', border: '#34d399' },
    { id: 'light', name: '☀️ Light', color: '#f8f9fa', border: '#2563eb' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tu Perfil de Atleta</h1>
        <p className="opacity-60 text-sm">Configuración de cuenta, datos antropométricos y sincronización de reloj</p>
      </div>

      {/* User Header */}
      <div className="surface p-6 rounded-2xl border border-white/5 flex items-center gap-5">
        {session?.user?.user_metadata?.avatar_url ? (
          <img src={session.user.user_metadata.avatar_url} className="w-20 h-20 rounded-full border-2 border-accent" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-accent">
            <User size={36} />
          </div>
        )}
        <div className="space-y-1">
          <h2 className="text-xl font-bold">{displayName || session?.user?.email}</h2>
          <p className="text-xs opacity-60 flex items-center gap-1">
            <Shield size={12} className="text-emerald-400" /> Cuenta autenticada con Google & Supabase
          </p>
          <span className="inline-block text-[10px] bg-accent/15 text-accent font-semibold px-2 py-0.5 rounded-full">
            Especialidad: Running & Fútbol
          </span>
        </div>
      </div>

      {/* Huawei Health Connection Card */}
      <div className="surface p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              huaweiConnected 
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                : 'bg-red-500/15 text-red-400 border-red-500/30'
            }`}>
              <Watch size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Huawei Health Kit
                {huaweiConnected ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={10} /> Conectado
                  </span>
                ) : (
                  <span className="text-[10px] bg-white/10 opacity-70 font-semibold px-2 py-0.5 rounded-full">
                    Pendiente
                  </span>
                )}
              </h3>
              <p className="text-xs opacity-60">Sincronización automática de tu Huawei Watch GT Pro 6</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {huaweiConnected ? (
              <>
                <button
                  type="button"
                  onClick={handleSyncDataNow}
                  disabled={huaweiSyncing}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <RefreshCw size={13} className={huaweiSyncing ? 'animate-spin' : ''} />
                  {huaweiSyncing ? 'Sincronizando...' : 'Sincronizar Datos'}
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectHuawei}
                  className="text-xs opacity-50 hover:opacity-100 hover:text-red-400 p-2 transition cursor-pointer"
                  title="Desconectar reloj"
                >
                  Desvincular
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectHuawei}
                disabled={huaweiLoading}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                {huaweiLoading ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <ExternalLink size={13} />
                )}
                Vincular Huawei Health
              </button>
            )}
          </div>
        </div>

        {huaweiMsg && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            huaweiMsg.startsWith('✅')
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium'
              : 'bg-white/5 border-white/10 text-white/80'
          }`}>
            {huaweiMsg.startsWith('✅') ? (
              <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle size={15} className="shrink-0 text-accent" />
            )}
            <span>{huaweiMsg}</span>
          </div>
        )}

        <div className="bg-white/5 p-3 rounded-xl text-xs opacity-75 leading-relaxed flex items-center justify-between">
          <span>Dispositivo vinculado: <strong>Huawei Watch GT Pro 6</strong></span>
          <span className="text-accent font-semibold">Client ID: 118718031</span>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="surface p-6 rounded-2xl border border-white/5 space-y-4">
        <h3 className="text-lg font-semibold border-b border-white/5 pb-3">Datos Deportivos para el Coach IA</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold opacity-70 mb-1">Nombre Completo</label>
            <input 
              type="text" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold opacity-70 mb-1">Nivel Deportivo</label>
            <select
              value={fitnessLevel}
              onChange={(e) => setFitnessLevel(e.target.value)}
              className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="beginner">Principiante (Iniciando)</option>
              <option value="intermediate">Intermedio (Regular)</option>
              <option value="advanced">Avanzado (Competitivo)</option>
              <option value="elite">Élite (Alto Rendimiento)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold opacity-70 mb-1">Peso (kg)</label>
            <input 
              type="number" 
              value={weightKg} 
              onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="70"
              className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold opacity-70 mb-1">Altura (cm)</label>
            <input 
              type="number" 
              value={heightCm} 
              onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="175"
              className="w-full bg-[var(--bg-color)] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Check size={14} /> ¡Datos guardados exitosamente!
            </span>
          )}
          {!saveSuccess && <span></span>}

          <button
            type="submit"
            disabled={saving}
            className="bg-accent text-black font-semibold text-xs px-5 py-2.5 rounded-xl hover:opacity-90 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 ml-auto"
          >
            <Save size={14} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>

      {/* Theme Picker */}
      <div className="surface p-6 rounded-2xl border border-white/5 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Temas de la Aplicación</h3>
          <p className="text-xs opacity-60 mt-0.5">Personaliza los colores oscuros, amoled y de contraste</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {themes.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleThemeChange(theme.id)}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
                  isSelected ? 'border-accent ring-2 ring-accent/30' : 'border-white/10 hover:border-white/30'
                }`}
                style={{ backgroundColor: theme.color }}
              >
                <div 
                  className="w-6 h-6 rounded-full border-2" 
                  style={{ backgroundColor: theme.border, borderColor: '#fff' }} 
                />
                <span className="text-xs font-semibold text-white truncate">{theme.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PWA App Installation Card */}
      <div className="surface p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shrink-0">
            <Smartphone size={22} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Instalar Proff IA en tu Celular (PWA)</h3>
            <p className="text-xs opacity-60 mt-0.5">Usa la aplicación a pantalla completa como una app nativa en iOS o Android</p>
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2.5 text-xs">
          <p className="font-semibold text-white/90">📲 Instrucciones rápidas:</p>
          <ul className="list-disc pl-4 space-y-1 text-white/70">
            <li><strong>En Android (Chrome):</strong> Toca los 3 puntos (⋮) arriba a la derecha y selecciona <em>"Instalar aplicación"</em> o <em>"Añadir a la pantalla principal"</em>.</li>
            <li><strong>En iPhone / iPad (Safari):</strong> Toca el icono de Compartir (⬆️) en la barra inferior y selecciona <em>"Añadir a la pantalla de inicio"</em>.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
