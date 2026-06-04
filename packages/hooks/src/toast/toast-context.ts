'use client';

import { createContext } from 'react';

//===================================================================

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastInput = {
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

export type ToastContextValue = {
  show: (toast: ToastInput) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
};

//===================================================================

export const ToastContext = createContext<ToastContextValue | null>(null);
