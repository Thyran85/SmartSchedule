import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    options: ConfirmOptions;
    resolve?: (v: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      setState({ options, resolve });
    });
  }, []);

  const handle = (value: boolean) => {
    state?.resolve?.(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {state && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            aria-label="Fermer"
            className="fixed inset-0 animate-fade-in bg-ink/45"
            onClick={() => handle(false)}
          />
          <div className="relative w-full max-w-sm animate-pop-in rounded-[18px] border border-line bg-surface p-6 shadow-pop">
            <div
              className={
                'mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full ' +
                (state.options.danger
                  ? 'bg-danger-soft text-danger'
                  : 'bg-gold-soft text-gold-strong')
              }
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-center text-base font-semibold">
              {state.options.title || 'Confirmation'}
            </h3>
            <p className="mt-2 text-center text-sm leading-relaxed text-body">
              {state.options.message}
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => handle(false)}>
                Annuler
              </Button>
              <Button
                variant={state.options.danger ? 'danger' : 'primary'}
                className="flex-1"
                onClick={() => handle(true)}
                autoFocus
              >
                {state.options.confirmLabel || 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue['confirm'] {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}