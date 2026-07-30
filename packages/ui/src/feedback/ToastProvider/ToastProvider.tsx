'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Toast, DEFAULT_TOAST_DURATION, type ToastVariant } from '../Toast';

import {
  ToastContext,
  type ToastContextValue,
  type ToastInput,
} from './toast-context';

//===================================================================

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
};

type ToastProviderProps = {
  children: ReactNode;
};

//===================================================================

const MAX_VISIBLE_TOASTS = 4;

//===================================================================

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

//===================================================================

function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

  const show = useCallback((toast: ToastInput) => {
    const message = toast.message.trim();

    if (!message) return;

    const id = createToastId();
    const variant = toast.variant ?? 'success';

    setToasts((prev) => {
      const withoutDuplicate = prev.filter(
        (item) => !(item.message === message && item.variant === variant)
      );

      return [
        ...withoutDuplicate,
        {
          id,
          message,
          variant,
          duration: toast.duration ?? DEFAULT_TOAST_DURATION,
        },
      ].slice(-MAX_VISIBLE_TOASTS);
    });
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message, duration) =>
        show({ message, duration, variant: 'success' }),

      error: (message, duration) =>
        show({ message, duration, variant: 'error' }),

      info: (message, duration) => show({ message, duration, variant: 'info' }),

      warning: (message, duration) =>
        show({ message, duration, variant: 'warning' }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          duration={toast.duration}
          offsetIndex={index}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}

export default ToastProvider;
export { useToast } from './useToast';
export { ToastProvider };
