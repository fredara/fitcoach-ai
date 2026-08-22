import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { Mail, Lock, User, Phone, Calendar, Weight, Target, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [targetGoal, setTargetGoal] = useState('Bajar a 4:30 min/km en carrera (10K / 5K)');

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión con Google');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Correo o contraseña incorrectos. Verifica tus datos o regístrate.');
        }
        throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setErrorMsg('Por favor completa los campos obligatorios (Nombre, Correo y Contraseña).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            age: age ? Number(age) : null,
            weight_kg: weight ? Number(weight) : null,
            target_goal: targetGoal,
          }
        }
      });

      if (error) throw error;

      // Si se crea el usuario inmediatamente, sincronizar perfil en base de datos
      if (data?.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: fullName.trim(),
            fitness_level: 'intermediate',
            weight_kg: weight ? Number(weight) : 70,
            height_cm: 175,
            created_at: new Date().toISOString(),
          });
        } catch {
          // Perfil sincronizado o manejado por trigger
        }
      }

      if (data?.session) {
        setSuccessMsg('¡Cuenta creada exitosamente! Iniciando sesión...');
      } else {
        setSuccessMsg('¡Registro completado! Si se requiere confirmación por correo, revisa tu bandeja de entrada.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--bg-color)] text-[var(--text-color)]">
      <div className="surface p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/10 relative overflow-hidden backdrop-blur-xl">
        
        {/* Glow de fondo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 text-accent mb-3 shadow-lg">
            <Target size={28} className="animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Proff IA</h1>
          <p className="text-sm opacity-70 mt-1">Entrenador Deportivo Inteligente de Alto Rendimiento</p>
        </div>

        {/* Selector de Pestaña (Login / Register) */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer ${
              mode === 'login' ? 'bg-accent text-black shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition cursor-pointer ${
              mode === 'register' ? 'bg-accent text-black shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            Registrarme
          </button>
        </div>

        {/* Mensajes de Alerta */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-red-400 text-xs animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 bg-green-500/15 border border-green-500/30 rounded-2xl flex items-start gap-2.5 text-green-400 text-xs animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Formulario Login */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 ml-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent text-white transition placeholder:text-white/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1.5 ml-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent text-white transition placeholder:text-white/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-black font-bold py-3.5 px-4 rounded-2xl hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2 mt-6 shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Entrar a Proff IA</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Formulario Registro */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1 ml-1">
                Nombre Completo *
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre y apellido"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white transition placeholder:text-white/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1 ml-1">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white transition placeholder:text-white/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1 ml-1">
                Contraseña (mínimo 6 caracteres) *
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white transition placeholder:text-white/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1 ml-1">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+58 412 1234567"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white transition placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1 ml-1">
                  Edad
                </label>
                <div className="relative">
                  <Calendar size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                    placeholder="28"
                    min={10}
                    max={100}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent text-white transition placeholder:text-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1 ml-1">
                  Peso (kg)
                </label>
                <div className="relative">
                  <Weight size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="number"
                    step="0.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                    placeholder="70"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent text-white transition placeholder:text-white/20"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1 ml-1">
                Objetivo Deportivo Principal
              </label>
              <div className="relative">
                <Target size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <select
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(e.target.value)}
                  className="w-full bg-[#1c1c1f] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs md:text-sm focus:outline-none focus:border-accent text-white transition cursor-pointer"
                >
                  <option value="Bajar a 4:30 min/km en carrera (10K / 5K)">🎯 Bajar a 4:30 min/km en 10K / 5K</option>
                  <option value="Desarrollar resistencia cardiovascular y fondo aeróbico">🏃 Resistencia y fondo aeróbico</option>
                  <option value="Preparación física para fútbol y deportes intermitentes">⚽ Preparación para fútbol</option>
                  <option value="Pérdida de grasa, salud y condición física general">🔥 Pérdida de grasa y salud</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-black font-bold py-3.5 px-4 rounded-2xl hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-2 mt-5 shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <span>Crear Mi Cuenta en Proff IA</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Separador Google */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative bg-[#18181b] px-4 text-xs uppercase tracking-wider text-white/40 font-medium">
            o continúa con
          </span>
        </div>

        {/* Botón Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-3 px-4 rounded-2xl border border-white/10 transition cursor-pointer flex items-center justify-center gap-3 text-sm shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </button>

      </div>
    </div>
  );
}
