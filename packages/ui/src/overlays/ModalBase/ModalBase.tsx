'use client';

import { type CSSProperties, type ReactNode, useRef } from 'react';
import clsx from 'clsx';

import { useBackdropClick, useOverlayLayer } from '@e-pharmacy/hooks';

import css from './ModalBase.module.css';

//===================================================================

type AccessibleNameProps =
  | Readonly<{ labelledBy: string; ariaLabel?: never }>
  | Readonly<{ ariaLabel: string; labelledBy?: never }>;

//===================================================================

type ModalBaseCommonProps = Readonly<{
  children: ReactNode;
  isOpen?: boolean;
  describedBy?: string;
  className?: string;
  dialogClassName?: string;
  style?: CSSProperties;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  onClose: () => void;
}>;

//===================================================================

export type ModalBaseProps = ModalBaseCommonProps & AccessibleNameProps;

//===================================================================

function ModalBase({
  children,
  isOpen = true,
  labelledBy,
  ariaLabel,
  describedBy,
  className,
  dialogClassName,
  style,
  closeOnBackdrop = true,
  closeOnEscape = true,
  onClose,
}: ModalBaseProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const handleBackdropMouseDown = useBackdropClick({
    onClose: closeOnBackdrop ? onClose : () => {},
  });

  useOverlayLayer({
    isOpen,
    containerRef: dialogRef,
    onClose,
    closeOnEscape,
  });

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
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}

export default ModalBase;
export { ModalBase };
