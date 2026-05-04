import { useCallback } from 'react';

//===================================================================

type UseBackdropClickParams = {
  onClose: () => void;
};

//===================================================================

export function useBackdropClick({ onClose }: UseBackdropClickParams) {
  return useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );
}
