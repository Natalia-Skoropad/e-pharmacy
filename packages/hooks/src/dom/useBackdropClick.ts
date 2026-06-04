'use client';

import { useCallback, type MouseEvent } from 'react';

//===================================================================

type UseBackdropClickParams = {
  onClose: () => void;
};

//===================================================================

export function useBackdropClick({ onClose }: UseBackdropClickParams) {
  return useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );
}
