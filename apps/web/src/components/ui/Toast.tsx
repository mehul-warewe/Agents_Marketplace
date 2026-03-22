'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]); // max 5 toasts
    setTimeout(() => dismiss(id), type === 'error' ? 6000 : 4000);
  }, [dismiss]);

  const success = useCallback((m: string) => toast(m, 'success'), [toast]);
  const error   = useCallback((m: string) => toast(m, 'error'),   [toast]);
  const warning = useCallback((m: string) => toast(m, 'warning'), [toast]);
  const info    = useCallback((m: string) => toast(m, 'info'),    [toast]);

  // Global access pattern (for non-React code)
  React.useEffect(() => {
    (window as any).__toast = { toast, success, error, warning, info };
    return () => { delete (window as any).__toast; };
  }, [toast, success, error, warning, info]);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />,
    error:   <XCircle      size={15} className="text-red-400 shrink-0" />,
    warning: <AlertTriangle size={15} className="text-amber-400 shrink-0" />,
    info:    <Info          size={15} className="text-blue-400 shrink-0" />,
  };

  const styles: Record<ToastType, string> = {
    success: 'border-emerald-500/20 bg-emerald-500/5',
    error:   'border-red-500/20 bg-red-500/5',
    warning: 'border-amber-500/20 bg-amber-500/5',
    info:    'border-blue-500/20 bg-blue-500/5',
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none font-inter">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`
              flex items-start gap-3 px-4 py-3 rounded-xl
              border backdrop-blur-xl shadow-2xl shadow-black/30
              bg-card/80 ${styles[t.type]}
              text-[11px] font-medium text-foreground/90
              max-w-[420px] w-full
              pointer-events-auto
              animate-in slide-in-from-bottom-3 fade-in duration-300
            `}
          >
            {icons[t.type]}
            <span className="flex-1 leading-relaxed">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted/40 hover:text-foreground transition-colors shrink-0 mt-0.5"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
