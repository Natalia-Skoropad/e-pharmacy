'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';

import ModalBase from '../ModalBase/ModalBase';
import ModalRoot from '../ModalRoot/ModalRoot';

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
  const titleId = `${id}-title`;

  if (!isOpen) return null;

  return (
    <ModalRoot>
      <ModalBase
        isOpen={isOpen}
        labelledBy={titleId}
        className={clsx(classNames.backdrop, classNames.backdropOpen)}
        dialogClassName={classNames.panel}
        onClose={onClose}
      >
        <h2 className="visually-hidden" id={titleId}>
          {title}
        </h2>
        {children}
      </ModalBase>
    </ModalRoot>
  );
}

export default MobileOffcanvasBase;
export { MobileOffcanvasBase };
