import React, { createContext, useContext, useState } from 'react';
import { 
  AlertTriangle, CheckCircle2, XCircle, 
  HelpCircle, Info, X 
} from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  icon?: 'warning' | 'danger' | 'question' | 'info';
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'accent' | 'default';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  buttonText?: string;
  onClose?: () => void;
}

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

interface ModalContextType {
  confirm: (options: ConfirmOptions) => void;
  showAlert: (options: AlertOptions) => void;
  showToast: (options: ToastOptions | string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [confirmConfig, setConfirmConfig] = useState<ConfirmOptions | null>(null);
  const [alertConfig, setAlertConfig] = useState<AlertOptions | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const confirm = (options: ConfirmOptions) => {
    setConfirmConfig(options);
  };

  const showAlert = (options: AlertOptions) => {
    setAlertConfig(options);
  };

  const showToast = (options: ToastOptions | string) => {
    const message = typeof options === 'string' ? options : options.message;
    const type = typeof options === 'string' ? 'success' : (options.type || 'success');
    const duration = typeof options === 'string' ? 4000 : (options.duration || 4000);
    const id = Math.random().toString(36).substring(2, 9);

    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const handleConfirmAction = async () => {
    if (confirmConfig) {
      const action = confirmConfig.onConfirm;
      setConfirmConfig(null);
      await action();
    }
  };

  const handleCancelAction = () => {
    if (confirmConfig?.onCancel) {
      confirmConfig.onCancel();
    }
    setConfirmConfig(null);
  };

  const handleAlertClose = () => {
    if (alertConfig?.onClose) {
      alertConfig.onClose();
    }
    setAlertConfig(null);
  };

  return (
    <ModalContext.Provider value={{ confirm, showAlert, showToast }}>
      {children}

      {/* Confirmation Modal */}
      {confirmConfig && (
        <div 
          className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={handleCancelAction}
        >
          <div 
            className="surface border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmConfig.variant === 'danger' || confirmConfig.icon === 'danger' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : confirmConfig.icon === 'warning' 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-accent/20 text-accent border border-accent/30'
              }`}>
                {confirmConfig.variant === 'danger' || confirmConfig.icon === 'danger' ? (
                  <AlertTriangle size={24} />
                ) : confirmConfig.icon === 'warning' ? (
                  <AlertTriangle size={24} />
                ) : confirmConfig.icon === 'info' ? (
                  <Info size={24} />
                ) : (
                  <HelpCircle size={24} />
                )}
              </div>

              <div className="space-y-1 flex-1">
                <h3 className="text-base font-bold text-white leading-tight">
                  {confirmConfig.title}
                </h3>
                <p className="text-xs opacity-75 leading-relaxed">
                  {confirmConfig.message}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancelAction}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold hover:bg-white/5 text-white/80 transition cursor-pointer"
              >
                {confirmConfig.cancelText || 'Cancelar'}
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg ${
                  confirmConfig.variant === 'danger'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-accent text-black hover:opacity-90'
                }`}
              >
                {confirmConfig.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert / Informational Modal */}
      {alertConfig && (
        <div 
          className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={handleAlertClose}
        >
          <div 
            className="surface border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                alertConfig.type === 'error'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : alertConfig.type === 'warning'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : alertConfig.type === 'info'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {alertConfig.type === 'error' ? (
                  <XCircle size={24} />
                ) : alertConfig.type === 'warning' ? (
                  <AlertTriangle size={24} />
                ) : alertConfig.type === 'info' ? (
                  <Info size={24} />
                ) : (
                  <CheckCircle2 size={24} />
                )}
              </div>

              <div className="space-y-1 flex-1">
                <h3 className="text-base font-bold text-white leading-tight">
                  {alertConfig.title}
                </h3>
                <p className="text-xs opacity-75 leading-relaxed">
                  {alertConfig.message}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-end">
              <button
                type="button"
                onClick={handleAlertClose}
                className="px-5 py-2 rounded-xl bg-accent text-black text-xs font-bold hover:opacity-90 transition cursor-pointer shadow-md"
              >
                {alertConfig.buttonText || 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Modern Toast Stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-slide-up pointer-events-auto ${
                toast.type === 'error'
                  ? 'bg-red-950/80 border-red-500/30 text-red-200'
                  : toast.type === 'info'
                  ? 'bg-blue-950/80 border-blue-500/30 text-blue-200'
                  : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs font-medium">
                {toast.type === 'error' ? (
                  <XCircle size={16} className="text-red-400 shrink-0" />
                ) : toast.type === 'info' ? (
                  <Info size={16} className="text-blue-400 shrink-0" />
                ) : (
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                )}
                <span>{toast.message}</span>
              </div>

              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="opacity-50 hover:opacity-100 transition p-1"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
