'use client';

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import Toast from '@/components/common/Toast';

//===================================================================

export type ToastVariant = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
};

type ToastInput = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  show: (toast: ToastInput) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
};

type ToastProviderProps = {
  children: ReactNode;
};

//===================================================================

const DEFAULT_TOAST_DURATION = 5000;

export const ToastContext = createContext<ToastContextValue | null>(null);

//===================================================================

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

  const show = useCallback((toast: ToastInput) => {
    const id = createToastId();

    setToasts((prev) => [
      ...prev,
      {
        id,
        message: toast.message,
        variant: toast.variant ?? 'success',
        duration: toast.duration ?? DEFAULT_TOAST_DURATION,
      },
    ]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message, duration) =>
        show({ message, duration, variant: 'success' }),
      error: (message, duration) =>
        show({ message, duration, variant: 'error' }),
      info: (message, duration) => show({ message, duration, variant: 'info' }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}

export default ToastProvider;
