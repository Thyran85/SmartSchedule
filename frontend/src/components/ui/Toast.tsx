import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import clsx from 'clsx';

type ToastTone = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
  };
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { icon: ReactNode; wrap: string; iconColor: string }> = {
  success: {
    icon: <CheckCircle2 />,
    wrap: 'text-success-strong',
    iconColor: 'text-success',
  },
  error: {
    icon: <XCircle />,
    wrap: 'text-danger',
    iconColor: 'text-danger',
  },
  warning: {
    icon: <AlertTriangle />,
    wrap: 'text-gold-strong',
    iconColor: 'text-gold',
  },
  info: {
    icon: <Info />,
    wrap: 'text-primary',
    iconColor: 'text-primary',
  },
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((tone: ToastTone, title: string, description?: string) => {
    const id = ++counter;
    setToasts(prev => [...prev, { id, tone, title, description }]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4200);
  }, []);

  const value: ToastContextValue = {
    toast: {
      success: (t, d) => push('success', t, d),
      error: (t, d) => push('error', t, d),
      warning: (t, d) => push('warning', t, d),
      info: (t, d) => push('info', t, d),
    },
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-2.5">
        {toasts.map(t => {
          const s = toneStyles[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex animate-slide-in items-start gap-3 rounded-[14px] border border-line bg-surface p-3.5 shadow-pop"
            >
              <span className={clsx('mt-0.5 shrink-0 [&>svg]:h-5 [&>svg]:w-5', s.iconColor)}>
                {s.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className={clsx('text-sm font-semibold', s.wrap)}>{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-body">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-black/5 hover:text-body"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue['toast'] {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}