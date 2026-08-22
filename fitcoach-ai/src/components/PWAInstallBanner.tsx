import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Sparkles } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('pwa_banner_dismissed') === 'true';
  });

  useEffect(() => {
    // Verificar si ya está corriendo en modo standalone (instalada)
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isStandaloneMode);

    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Capturar evento de instalación para Chrome / Android / Desktop
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (isStandalone || dismissed) {
    return null;
  }

  // Si no es iOS y aún no hay deferredPrompt en algunos navegadores, igual podemos mostrar el banner informativo
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setDismissed(true);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Instrucción genérica para navegadores que bloquean o requieren menú
      alert('Para instalar: Haz clic en el menú de 3 puntos de tu navegador (⋮) y selecciona "Instalar aplicación" o "Añadir a pantalla de inicio".');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  return (
    <>
      {/* Banner flotante inferior */}
      <aside 
        aria-label="Aviso de instalación de aplicación"
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300"
      >
        <div className="surface p-4 rounded-2xl border border-accent/30 shadow-2xl backdrop-blur-xl bg-[#121214]/95 flex items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shrink-0 shadow-sm">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs md:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                Instalar Proff IA
                <span className="text-[9px] bg-accent text-black font-extrabold px-1.5 py-0.2 rounded-full">APP</span>
              </h2>
              <p className="text-[11px] opacity-70 truncate">
                Acceso rápido y pantalla completa en tu teléfono
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-accent text-black font-bold text-xs px-3.5 py-2 rounded-xl hover:opacity-90 transition cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <Download size={14} />
              <span>Instalar</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="Cerrar aviso"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Guía Explicativa para iPhone / iPad (iOS) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-4">
          <div className="surface p-6 rounded-3xl border border-white/10 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 text-white/50 hover:text-white rounded-full bg-white/5"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent mx-auto mb-3">
                <Download size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Instalar en tu iPhone / iPad</h3>
              <p className="text-xs opacity-70 mt-1">Sigue estos 2 sencillos pasos en Safari:</p>
            </div>

            <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5 text-xs text-white/90 mb-5">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-accent text-black font-bold flex items-center justify-center text-xs shrink-0">1</span>
                <span>Toca el botón <strong>Compartir</strong> <Share size={14} className="inline ml-1 text-accent" /> en la barra de Safari.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-accent text-black font-bold flex items-center justify-center text-xs shrink-0">2</span>
                <span>Desliza y selecciona <strong>"Añadir a la pantalla de inicio"</strong> <PlusSquare size={14} className="inline ml-1 text-accent" />.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-accent text-black font-bold py-3 rounded-xl text-xs hover:opacity-90 transition cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
