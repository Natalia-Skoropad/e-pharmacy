import type { ReactNode } from 'react';
import { CloseIconButton } from './CloseIconButton';

//=============================================================================

export type ModalBaseProps = {
  isOpen: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  className?: string;
  backdropClassName?: string;
  contentClassName?: string;
  showCloseButton?: boolean;
};

//=============================================================================

export function ModalBase({
  isOpen,
  title,
  children,
  onClose,
  closeLabel,
  className,
  backdropClassName,
  contentClassName,
  showCloseButton = true,
}: ModalBaseProps) {
  if (!isOpen) return null;

  return (
    <div className={className} role="presentation">
      <button
        type="button"
        className={backdropClassName}
        aria-label={closeLabel ?? 'Close modal'}
        onClick={onClose}
      />
      <div
        className={contentClassName}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {showCloseButton ? (
          <CloseIconButton
            label={closeLabel ?? 'Close modal'}
            onClick={onClose}
          />
        ) : null}
        {title ? <h2>{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}
