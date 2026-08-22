import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../contexts/PlanContext';
import { useModal } from '../contexts/ModalContext';
import { supabase } from '../config/supabase';
import { api } from '../services/api';
import { MarkdownContent } from '../components/chat/MarkdownContent';
import { 
  Send, Bot, User, Sparkles, RefreshCw, AlertCircle, 
  Image as ImageIcon, X, Maximize2, CheckCircle2, Target
} from 'lucide-react';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  image?: string;
  saved_session?: any;
  plan_update?: any;
  created_at?: string;
}

export default function Chat() {
  const { session } = useAuth();
  const { applyPlanUpdateFromAI } = usePlan();
  const { confirm: confirmModal, showToast } = useModal();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionSavedNotification, setSessionSavedNotification] = useState<string | null>(null);
  const [planUpdatedNotification, setPlanUpdatedNotification] = useState<string | null>(null);
  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Ajustar altura del textarea dinámicamente según el contenido
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 160);
    textarea.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // Cargar historial previo de Supabase
  useEffect(() => {
    async function loadHistory() {
      if (!session?.user?.id) return;
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true })
          .limit(50);

        if (!error && data && data.length > 0) {
          setMessages(data.map(m => {
            const rawImages = m.metadata?.images || (m.metadata?.image_url ? [m.metadata.image_url] : []);
            return {
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              images: rawImages,
              created_at: m.created_at,
            };
          }));
        } else {
          setMessages([
            {
              role: 'assistant',
              content: `¡Hola **${session.user.user_metadata?.full_name?.split(' ')[0] || 'Freddy'}**! 🏃‍♂️⚽\n\nSoy tu **Coach IA de alto rendimiento** (metodología Runna & Strava Pro).\n\n🎯 **Nuestra meta principal**: Bajar tu ritmo a **4:30 min/km** y potenciar tu VO2 Máx para running y fútbol.\n\nPuedes contarme tus sensaciones o **enviarme capturas de pantalla de tu reloj Huawei/Garmin**; extraeré automáticamente tus datos numéricos, los registraré en tu historial de carrera y te daré tu diagnóstico de rendimiento y pautas nutricionales.`,
            }
          ]);
        }
      } catch (err) {
        console.error('Error al cargar historial:', err);
      }
    }
    loadHistory();
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Procesar archivo de imagen y comprimirlo a base64
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        return;
      }

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

          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const dataUrl = await processImageFile(files[i]);
        if (dataUrl) newImages.push(dataUrl);
      }
      setSelectedImages((prev) => [...prev, ...newImages].slice(0, 5));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Soporte para pegar múltiples imágenes del portapapeles (Ctrl + V)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const pastedImages: string[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const dataUrl = await processImageFile(file);
          if (dataUrl) pastedImages.push(dataUrl);
        }
      }
    }
    if (pastedImages.length > 0) {
      setSelectedImages((prev) => [...prev, ...pastedImages].slice(0, 5));
    }
  };

  const removeImageAt = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if ((!messageContent && selectedImages.length === 0) || loading) return;

    const currentImages = [...selectedImages];
    setInput('');
    setSelectedImages([]);
    setErrorMsg(null);

    // Resetear altura del textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }

    const newMessages: Message[] = [
      ...messages,
      { 
        role: 'user', 
        content: messageContent || (currentImages.length > 0 ? 'Analiza estas capturas de pantalla deportivas.' : ''),
        images: currentImages.length > 0 ? currentImages : undefined
      }
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const payload = newMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ 
          role: m.role, 
          content: m.content,
          images: m.images || (m.image ? [m.image] : undefined)
        }));

      const response = await api.sendChatMessage(payload);

      if (response.saved_session) {
        setSessionSavedNotification(`✅ ¡Sesión de ${response.saved_session.title} registrada automáticamente en tu Historial!`);
        setTimeout(() => setSessionSavedNotification(null), 5000);
      }

      if (response.plan_update) {
        applyPlanUpdateFromAI(response.plan_update);
        const dayInfo = response.plan_update.day_name || response.plan_update.updated_day?.day_name || 'tu calendario';
        const weekInfo = response.plan_update.week_number ? `Semana ${response.plan_update.week_number}` : 'Plan';
        setPlanUpdatedNotification(`🎯 ¡Plan de entrenamiento actualizado por el Coach IA! (${weekInfo} • ${dayInfo})`);
        setTimeout(() => setPlanUpdatedNotification(null), 6000);
      }

      setMessages([
        ...newMessages,
        { 
          role: 'assistant', 
          content: response.content,
          saved_session: response.saved_session,
          plan_update: response.plan_update,
        }
      ]);
    } catch (err: any) {
      console.error('Error enviando mensaje:', err);
      setErrorMsg(err.message || 'Error al conectar con el Coach IA');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    confirmModal({
      title: '¿Reiniciar conversación con el Coach IA?',
      message: 'Se borrará el historial del chat actual para iniciar una nueva consulta desde cero.',
      confirmText: 'Reiniciar Chat',
      variant: 'danger',
      icon: 'warning',
      onConfirm: async () => {
        if (session?.user?.id) {
          await supabase.from('chat_messages').delete().eq('user_id', session.user.id);
        }
        setMessages([
          {
            role: 'assistant',
            content: 'Conversación reiniciada. Puedes escribirme o enviarme capturas de pantalla de tus entrenamientos.',
          }
        ]);
        showToast('Conversación reiniciada.');
      }
    });
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
      
      {/* Header del Chat */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
            <Bot size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              Coach IA Deportivo
              <span className="text-[10px] bg-accent/20 text-accent font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={10} /> Objetivo: Sub 4:30 /km
              </span>
            </h1>
            <p className="text-[11px] opacity-60">Metodología Runna & Strava • Análisis de métricas y nutrición</p>
          </div>
        </div>

        <button 
          onClick={handleClearChat}
          className="text-xs opacity-60 hover:opacity-100 transition flex items-center gap-1.5 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
          title="Reiniciar chat"
        >
          <RefreshCw size={13} />
          <span className="hidden sm:inline">Limpiar chat</span>
        </button>
      </div>

      {/* Notificación de Auto-Guardado en Historial */}
      {sessionSavedNotification && (
        <div className="my-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 shrink-0 animate-fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <div className="flex-1 font-semibold">{sessionSavedNotification}</div>
        </div>
      )}

      {/* Notificación de Actualización del Plan */}
      {planUpdatedNotification && (
        <div className="my-2 p-2.5 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs flex items-center gap-2 shrink-0 animate-fade-in">
          <Target size={16} className="shrink-0" />
          <div className="flex-1 font-semibold">{planUpdatedNotification}</div>
        </div>
      )}

      {/* Alerta de Error si ocurre */}
      {errorMsg && (
        <div className="my-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 shrink-0">
          <AlertCircle size={16} className="shrink-0" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {/* Lista de Mensajes (sin scrolls horizontales y con scrollbar fino) */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 min-h-0">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const messageImgs = msg.images || (msg.image ? [msg.image] : []);

          return (
            <div 
              key={index}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isUser ? 'bg-white/10' : 'bg-accent/20 text-accent'
              }`}>
                {isUser ? (
                  session?.user?.user_metadata?.avatar_url ? (
                    <img src={session.user.user_metadata.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                  ) : <User size={15} />
                ) : <Bot size={15} />}
              </div>

              <div className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed space-y-3 ${
                isUser 
                  ? 'bg-accent text-black font-medium rounded-tr-none' 
                  : 'surface border border-white/5 text-[var(--text-color)] rounded-tl-none'
              }`}>
                
                {/* Renderizar Galería de Imágenes si hay múltiples */}
                {messageImgs.length > 0 && (
                  <div className={`grid gap-2 ${
                    messageImgs.length === 1 
                      ? 'grid-cols-1 max-w-sm' 
                      : messageImgs.length === 2 
                        ? 'grid-cols-2 max-w-md' 
                        : 'grid-cols-2 sm:grid-cols-3 max-w-lg'
                  }`}>
                    {messageImgs.map((imgUrl, imgIdx) => (
                      <div 
                        key={imgIdx} 
                        className="relative group rounded-xl overflow-hidden border border-black/10 aspect-video sm:aspect-square bg-black/20 cursor-pointer"
                        onClick={() => setActiveLightbox(imgUrl)}
                      >
                        <img 
                          src={imgUrl} 
                          alt={`Captura ${imgIdx + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Maximize2 size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Renderizar Contenido con Formato Markdown */}
                {msg.content && (
                  isUser ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <MarkdownContent content={msg.content} />
                  )
                )}

                {/* Badge si se registró sesión automáticamente */}
                {msg.saved_session && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <CheckCircle2 size={13} />
                    <span>Guardado en tu historial: {msg.saved_session.title}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
              <Bot size={15} />
            </div>
            <div className="surface border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }}></div>
              <span className="text-xs opacity-60 ml-2">El Coach está analizando tus métricas hacia el 4:30/km...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preview Strip de Múltiples Imágenes Adjuntas */}
      {selectedImages.length > 0 && (
        <div className="p-2 bg-white/5 border border-white/10 rounded-2xl mb-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="text-[11px] opacity-70 px-2 font-medium shrink-0">
            {selectedImages.length} {selectedImages.length === 1 ? 'captura' : 'capturas'}:
          </div>
          {selectedImages.map((imgData, i) => (
            <div key={i} className="relative group shrink-0">
              <img 
                src={imgData} 
                alt={`Adjunto ${i + 1}`} 
                className="w-14 h-14 object-cover rounded-xl border border-white/15" 
              />
              <button
                type="button"
                onClick={() => removeImageAt(i)}
                className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-md transition cursor-pointer"
                title="Quitar esta imagen"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-xl border border-dashed border-white/20 hover:border-accent hover:text-accent flex flex-col items-center justify-center text-[10px] opacity-70 hover:opacity-100 transition cursor-pointer shrink-0"
          >
            + Añadir
          </button>
        </div>
      )}

      {/* Formulario de Entrada Auto-Expandible (Limpio y sin barras innecesarias) */}
      <div className="surface border border-white/10 rounded-2xl p-2 flex items-end gap-2 focus-within:border-accent transition shrink-0">
        
        {/* Botón para Adjuntar Múltiples Imágenes */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          multiple
          className="hidden" 
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="p-2.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-accent transition cursor-pointer disabled:opacity-40 shrink-0 relative"
          title="Adjuntar capturas de tu reloj o fotos (admite selección múltiple o Ctrl+V)"
        >
          <ImageIcon size={20} />
          {selectedImages.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent"></span>
          )}
        </button>

        {/* Textarea Auto-Expandible */}
        <textarea 
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Escribe tu entrenamiento, sensaciones o pega capturas de tu reloj... (Shift+Enter para salto)"
          disabled={loading}
          rows={1}
          className="flex-1 bg-transparent border-0 resize-none px-2 py-2.5 text-sm focus:outline-none focus:ring-0 max-h-40 overflow-y-auto leading-relaxed disabled:opacity-50"
          style={{ minHeight: '44px' }}
        />

        {/* Botón de Envío */}
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={loading || (!input.trim() && selectedImages.length === 0)}
          className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 ${
            (input.trim() || selectedImages.length > 0) && !loading
              ? 'bg-accent text-black font-bold hover:opacity-90 shadow-lg scale-100'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
          title="Enviar mensaje"
        >
          <Send size={18} />
        </button>
      </div>

      {/* Modal Lightbox para ver imágenes en tamaño completo */}
      {activeLightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveLightbox(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
            <img 
              src={activeLightbox} 
              alt="Vista completa" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl" 
            />
            <button
              onClick={() => setActiveLightbox(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
