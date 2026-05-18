'use client';

import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react';

import css from './Toast.module.css';

//===================================================================

type ToastVariant = 'info' | 'success' | 'error';

type ToastProps = {
  message: string;
  isVisible: boolean;
  variant?: ToastVariant;
};

declare global {
  interface Window {
    __ePharmacyToastIds?: string[];
    __ePharmacyToastEventTarget?: EventTarget;
  }
}

const TOAST_STACK_EVENT = 'e-pharmacy-toast-stack-change';

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

function Toast({ message, isVisible, variant = 'info' }: ToastProps) {
  const reactId = useId();
  const toastId = useMemo(() => `toast-${reactId}`, [reactId]);
  const [stackIndex, setStackIndex] = useState(0);

  useEffect(() => {
    if (!isVisible || !message) return undefined;

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
  }, [isVisible, message, toastId]);

  if (!isVisible || !message) return null;

  return (
    <div
      className={css.toast}
      style={
        { '--toast-offset': `${Math.max(stackIndex, 0) * 64}px` } as CSSProperties
      }
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      data-variant={variant}
    >
      {message}
    </div>
  );
}

export default Toast;
