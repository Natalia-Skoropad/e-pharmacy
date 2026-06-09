'use client';

import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

import {
  useBackdropClick,
  useBodyScrollLock,
  useEscapeToClose,
  useFocusTrap,
} from '@e-pharmacy/hooks';

//===================================================================

type MobileOffcanvasBaseClassNames = {
  backdrop: string;
  backdropOpen: string;
  panel: string;
};

type MobileOffcanvasBaseProps = {
  id: string;
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  classNames: MobileOffcanvasBaseClassNames;
};

//===================================================================

function MobileOffcanvasBase({
  id,
  isOpen,
  title,
  onClose,
  children,
  classNames,
}: MobileOffcanvasBaseProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const handleBackdropClick = useBackdropClick({ onClose });

  useEscapeToClose({ isOpen, onClose });
  useBodyScrollLock(isOpen);
  useFocusTrap({ isOpen, containerRef: panelRef });

  const portalRoot = typeof document === 'undefined' ? null : document.body;
  if (!isOpen || !portalRoot) return null;

  return createPortal(
    <div
      className={clsx(classNames.backdrop, isOpen && classNames.backdropOpen)}
      aria-hidden={!isOpen}
      onClick={handleBackdropClick}
    >
      <aside
        ref={panelRef}
        className={classNames.panel}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
      >
        <h2 className="visually-hidden" id={`${id}-title`}>
          {title}
        </h2>

        {children}
      </aside>
    </div>,
    portalRoot
  );
}

export default MobileOffcanvasBase;

export { MobileOffcanvasBase };
