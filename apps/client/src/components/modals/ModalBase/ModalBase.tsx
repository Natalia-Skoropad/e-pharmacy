'use client';

import { type CSSProperties, type ReactNode, useId } from 'react';

import { useBackdropClick, useBodyScrollLock, useEscapeToClose } from '@/hooks';
import { cn } from '@/lib/utils';

import css from './ModalBase.module.css';

//===================================================================

type ModalBaseProps = {
  children: ReactNode;
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

  useBodyScrollLock(true);
  useEscapeToClose({ isOpen: closeOnEscape, onClose });

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
