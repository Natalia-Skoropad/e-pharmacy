'use client';

import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react';

import css from './Toast.module.css';

//===================================================================

type ToastVariant = 'info' | 'success' | 'error';

type ToastProps = {
  message: string;
  isVisible?: boolean;
  variant?: ToastVariant;
  type?: Extract<ToastVariant, 'success' | 'error'>;
  onClose?: () => void;
  duration?: number;
};

declare global {
  interface Window {
    __ePharmacyToastIds?: string[];
    __ePharmacyToastEventTarget?: EventTarget;
  }
}

const TOAST_STACK_EVENT = 'e-pharmacy-toast-stack-change';
const DEFAULT_TOAST_DURATION = 5000;

function getToastEventTarget(): EventTarget {
  window.__ePharmacyToastEventTarget ??= new EventTarget();

  return window.__ePharmacyToastEventTarget;
}

function notifyToastStackChange() {
  getToastEventTarget().dispatchEvent(new Event(TOAST_STACK_EVENT));
}

function addToast(id: string) {
  window.__ePharmacyToastIds ??= [];

  if (!window.__ePharmacyToastIds.includes(id)) {
    window.__ePharmacyToastIds.push(id);
    notifyToastStackChange();
  }
}

function removeToast(id: string) {
  window.__ePharmacyToastIds = (window.__ePharmacyToastIds ?? []).filter(
    (toastId) => toastId !== id
  );
  notifyToastStackChange();
}

//===================================================================

function Toast({
  message,
  isVisible = true,
  variant,
  type,
  onClose,
  duration = DEFAULT_TOAST_DURATION,
}: ToastProps) {
  const reactId = useId();
  const toastId = useMemo(() => `toast-${reactId}`, [reactId]);
  const [stackIndex, setStackIndex] = useState(0);

  const resolvedVariant = type ?? variant ?? 'success';
  const shouldShow = Boolean(isVisible && message);

  useEffect(() => {
    if (!shouldShow) return undefined;

    const updateStackIndex = () => {
      setStackIndex((window.__ePharmacyToastIds ?? []).indexOf(toastId));
    };

    addToast(toastId);
    updateStackIndex();

    const target = getToastEventTarget();
    target.addEventListener(TOAST_STACK_EVENT, updateStackIndex);

    return () => {
      target.removeEventListener(TOAST_STACK_EVENT, updateStackIndex);
      removeToast(toastId);
    };
  }, [shouldShow, toastId]);

  useEffect(() => {
    if (!shouldShow || !onClose) return undefined;

    const timeoutId = window.setTimeout(onClose, duration);

    return () => window.clearTimeout(timeoutId);
  }, [duration, onClose, shouldShow]);

  if (!shouldShow) return null;

  return (
    <div
      className={`${css.toast} ${
        resolvedVariant === 'error' ? css.error : css.success
      }`}
      style={
        { '--toast-offset': `${Math.max(stackIndex, 0) * 64}px` } as CSSProperties
      }
      role={resolvedVariant === 'error' ? 'alert' : 'status'}
      aria-live={resolvedVariant === 'error' ? 'assertive' : 'polite'}
    >
      <span className={css.dot} aria-hidden="true" />
      <p className={css.message}>{message}</p>
    </div>
  );
}

export default Toast;
