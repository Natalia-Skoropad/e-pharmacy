'use client';

import { type CSSProperties, type ReactNode, useId } from 'react';

import { useBackdropClick, useBodyScrollLock, useEscapeToClose } from '@/hooks';
import { cn } from '@/lib/utils';

import css from './ModalBase.module.css';

//===================================================================

type ModalBaseProps = {
  children: ReactNode;
  isOpen?: boolean;
  labelledBy?: string;
  className?: string;
  dialogClassName?: string;
  style?: CSSProperties;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  onClose: () => void;
};

//===================================================================

function ModalBase({
  children,
  isOpen = true,
  labelledBy,
  className,
  dialogClassName,
  style,
  closeOnBackdrop = true,
  closeOnEscape = true,
  onClose,
}: ModalBaseProps) {
  const fallbackTitleId = useId();
  const titleId = labelledBy ?? fallbackTitleId;
  const handleBackdropMouseDown = useBackdropClick({
    onClose: closeOnBackdrop ? onClose : () => {},
  });

  useBodyScrollLock(isOpen);
  useEscapeToClose({ isOpen: isOpen && closeOnEscape, onClose });

  if (!isOpen) return null;

  return (
    <div
      className={cn(css.backdrop, className)}
      role="presentation"
      style={style}
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className={cn(css.dialog, dialogClassName)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {children}
      </div>
    </div>
  );
}

export default ModalBase;
