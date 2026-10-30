'use client';

import { useContext, useState } from 'react';

import { ToastContext } from '../../feedback/ToastProvider/toast-context';

//===================================================================

/** Shared feedback for both dropzone and direct resource upload controls. */
export function useDocumentUploadFeedback(
  onSelectionError?: (message: string) => void
) {
  const toast = useContext(ToastContext);
  const [selectionError, setSelectionError] = useState('');

  const rejectSelection = (message: string) => {
    setSelectionError(message);
    onSelectionError?.(message);
    toast?.error(`Document not accepted. ${message}`);
  };

  const clearSelectionError = () => setSelectionError('');

  return { selectionError, rejectSelection, clearSelectionError };
}
