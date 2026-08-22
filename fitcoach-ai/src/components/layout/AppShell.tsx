import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { Home, Bot, Target, Calendar, Activity, User, LogOut } from 'lucide-react';

export default function AppShell() {
  const { session } = useAuth();
  const location = useLocation();

  const handleLogout = () => supabase.auth.signOut();

  const navItems = [
    { path: '/', label: 'Inicio', icon: Home },
    { path: '/chat', label: 'Coach IA', icon: Bot },
    { path: '/plan', label: 'Plan', icon: Target },
    { path: '/calendar', label: 'Calendario', icon: Calendar },
    { path: '/history', label: 'Historial', icon: Activity },
    { path: '/profile', label: 'Perfil', icon: User },
  ];

  const isChatPage = location.pathname === '/chat';

  return (
    <div className="h-screen w-screen bg-[var(--bg-color)] text-[var(--text-color)] flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 surface border-r border-white/5 p-4 shrink-0">
        <div className="mb-8 p-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-accent">FitCoach AI</h1>
          <span className="text-[10px] bg-accent/20 text-accent font-semibold px-2 py-0.5 rounded-full">v1.1</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive ? 'bg-accent text-black font-semibold shadow-md' : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                }`}
              >
                <Icon size={19} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/5 pt-4">
          <div className="flex items-center gap-3 mb-4 p-2">
            {session?.user?.user_metadata?.avatar_url ? (
              <img src={session.user.user_metadata.avatar_url} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <User size={20} />
              </div>
            )}
            <div className="overflow-hidden text-sm">
              <p className="font-semibold truncate">{session?.user?.user_metadata?.full_name || session?.user?.email}</p>
              <p className="text-xs opacity-50 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 p-3 w-full text-left text-red-400 hover:bg-red-400/10 rounded-xl transition cursor-pointer text-sm"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-0 ${isChatPage ? 'overflow-hidden' : 'overflow-y-auto'} pb-20 md:pb-0`}>
        <header className="md:hidden surface border-b border-white/5 p-4 flex justify-between items-center sticky top-0 z-10 shrink-0">
          <h1 className="text-xl font-bold text-accent">FitCoach AI</h1>
          {session?.user?.user_metadata?.avatar_url ? (
            <img src={session.user.user_metadata.avatar_url} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <User size={16} />
            </div>
          )}
        </header>
        
        <div className={`w-full flex-1 flex flex-col min-h-0 ${isChatPage ? 'p-3 md:p-6 max-w-5xl mx-auto' : 'p-4 md:p-8 max-w-7xl mx-auto'}`}>
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden surface border-t border-white/5 fixed bottom-0 left-0 right-0 p-2 flex justify-around z-20 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${
                isActive ? 'text-accent font-semibold' : 'opacity-50 hover:opacity-100'
              }`}
            >
              <Icon size={18} />
              <span className="text-[9px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
