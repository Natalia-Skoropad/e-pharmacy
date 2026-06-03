'use client';

import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

//===================================================================

type ModalRootProps = {
  children: ReactNode;
};

//===================================================================

function ModalRoot({ children }: ModalRootProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(children, document.body);
}

export default ModalRoot;
