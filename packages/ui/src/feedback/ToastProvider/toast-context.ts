'use client';

import { createContext } from 'react';

import type { ToastVariant } from '../Toast';

//===================================================================

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
  warning: (message: string, duration?: number) => void;
};

//===================================================================

export const ToastContext = createContext<ToastContextValue | null>(null);
