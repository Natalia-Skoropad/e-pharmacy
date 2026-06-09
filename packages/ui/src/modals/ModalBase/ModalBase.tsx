'use client';

import { type CSSProperties, type ReactNode, useId, useRef } from 'react';
import clsx from 'clsx';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
  useFocusTrap,
} from '@e-pharmacy/hooks';

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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const handleBackdropMouseDown = useBackdropClick({
    onClose: closeOnBackdrop ? onClose : () => {},
  });

  useBodyScrollLock(isOpen);
  useEscapeToClose({ isOpen: isOpen && closeOnEscape, onClose });
  useFocusTrap({ isOpen, containerRef: dialogRef });

  if (!isOpen) return null;

  return (
    <div
      className={clsx(css.backdrop, className)}
      role="presentation"
      style={style}
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        className={clsx(css.dialog, dialogClassName)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}

export default ModalBase;

export { ModalBase };
