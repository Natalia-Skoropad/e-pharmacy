'use client';

import { useEffect, type CSSProperties } from 'react';
import { X } from 'lucide-react';

import css from './Toast.module.css';

//===================================================================

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

//===================================================================

type ToastProps = {
  message: string;
  isVisible?: boolean;
  variant?: ToastVariant;
  type?: Extract<ToastVariant, 'success' | 'error'>;
  onClose?: () => void;
  duration?: number;
  offsetIndex?: number;
};

//===================================================================

export const DEFAULT_TOAST_DURATION = 5000;

const TOAST_LABELS: Record<ToastVariant, string> = {
  success: 'Success notification',
  error: 'Error notification',
  info: 'Information notification',
  warning: 'Warning notification',
};

//===================================================================

function Toast({
  message,
  isVisible = true,
  variant,
  type,
  onClose,
  duration = DEFAULT_TOAST_DURATION,
  offsetIndex = 0,
}: ToastProps) {
  const resolvedVariant = type ?? variant ?? 'success';
  const shouldShow = Boolean(isVisible && message.trim());

  useEffect(() => {
    if (!shouldShow || !onClose) return undefined;

    const timeoutId = window.setTimeout(onClose, duration);

    return () => window.clearTimeout(timeoutId);
  }, [duration, onClose, shouldShow]);

  if (!shouldShow) return null;

  return (
    <div
      className={`${css.toast} ${css[resolvedVariant]}`}
      style={
        {
          '--toast-offset': `${Math.max(offsetIndex, 0) * 68}px`,
        } as CSSProperties
      }
      role={
        resolvedVariant === 'error' || resolvedVariant === 'warning'
          ? 'alert'
          : 'status'
      }
      aria-live={
        resolvedVariant === 'error' || resolvedVariant === 'warning'
          ? 'assertive'
          : 'polite'
      }
      aria-label={TOAST_LABELS[resolvedVariant]}
    >
      <span className={css.dot} aria-hidden="true" />
      <p className={css.message}>{message}</p>

      {onClose ? (
        <button
          className={css.closeButton}
          type="button"
          aria-label="Close notification"
          onClick={onClose}
        >
          <X size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export default Toast;

export { Toast };
