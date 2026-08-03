'use client';

import { useCallback, useState } from 'react';

import { useToast } from '@e-pharmacy/ui/feedback';

//===================================================================

function copyWithSelectionFallback(value: string): boolean {
  if (typeof document === 'undefined') return false;

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    textarea.remove();
  }
}

//===================================================================

export type ClipboardActionResult = Readonly<{
  copy: (value: string, label: string) => Promise<boolean>;
  statusMessage: string;
}>;

//===================================================================

export function useClipboardAction(): ClipboardActionResult {
  const toast = useToast();
  const [statusMessage, setStatusMessage] = useState('');

  const copy = useCallback(
    async (value: string, label: string): Promise<boolean> => {
      try {
        if (
          typeof navigator !== 'undefined' &&
          typeof window !== 'undefined' &&
          window.isSecureContext &&
          navigator.clipboard
        ) {
          await navigator.clipboard.writeText(value);
        } else if (!copyWithSelectionFallback(value)) {
          throw new Error('Clipboard is unavailable.');
        }

        const message = `${label} copied.`;
        setStatusMessage(message);
        toast.success(message);
        return true;
      } catch {
        const message = `Could not copy ${label.toLowerCase()}.`;
        setStatusMessage(message);
        toast.error(message);
        return false;
      }
    },
    [toast]
  );

  return { copy, statusMessage } as const;
}
