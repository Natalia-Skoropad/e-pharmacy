'use client';

import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useRef,
} from 'react';

import clsx from 'clsx';

import { useBackdropPointer } from '../../internal/overlay/useBackdropPointer';
import { useOverlayLayer } from '../../internal/overlay/useOverlayLayer';

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
  initialFocusRef?: RefObject<HTMLElement | null>;
  fallbackFocusRef?: RefObject<HTMLElement | null>;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  restoreFocus?: boolean;
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
  initialFocusRef,
  fallbackFocusRef,
  closeOnBackdrop = true,
  closeOnEscape = true,
  restoreFocus = true,
  onClose,
}: ModalBaseProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const overlayIdRef = useRef(Symbol('modal-overlay'));

  const backdropPointerHandlers = useBackdropPointer({
    overlayId: overlayIdRef.current,
    enabled: closeOnBackdrop,
    onClose,
  });

  useOverlayLayer({
    id: overlayIdRef.current,
    isOpen,
    containerRef: dialogRef,
    onClose,
    initialFocusRef,
    fallbackFocusRef,
    closeOnEscape,
    restoreFocus,
  });

  if (!isOpen) return null;

  return (
    <div
      className={clsx(css.backdrop, className)}
      role="presentation"
      style={style}
      {...backdropPointerHandlers}
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
