import { useEffect } from 'react';

type UseEscapeToCloseParams = {
  isOpen: boolean;
  onClose: () => void;
};

export function useEscapeToClose({
  isOpen,
  onClose,
}: UseEscapeToCloseParams): void {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
}
