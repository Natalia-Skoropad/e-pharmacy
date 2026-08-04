'use client';

import { useId, useRef } from 'react';
import { ShoppingCart } from 'lucide-react';

import { Button, CloseIconButton } from '@e-pharmacy/ui/primitives';
import { ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';

import {
  CART_ORDER_LIMIT_ERROR_MESSAGE,
  CART_ORDER_LIMIT_MODAL_TITLE,
} from '@/lib/cart/order-limit';

import css from './CartOrderLimitModal.module.css';

//===================================================================

export type CartOrderLimitModalProps = Readonly<{
  onClose: () => void;
}>;

//===================================================================

function CartOrderLimitModal({ onClose }: CartOrderLimitModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dismissButtonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <ModalRoot>
      <ModalBase
        labelledBy={titleId}
        describedBy={descriptionId}
        initialFocusRef={dismissButtonRef}
        onClose={onClose}
      >
        <div className={css.header}>
          <span className={css.icon} aria-hidden="true">
            <ShoppingCart size={24} />
          </span>

          <h2 className={css.title} id={titleId}>
            {CART_ORDER_LIMIT_MODAL_TITLE}
          </h2>

          <CloseIconButton
            className={css.closeButton}
            variant="dark"
            label="Close order limit message"
            onClick={onClose}
          />
        </div>

        <p className={css.description} id={descriptionId}>
          {CART_ORDER_LIMIT_ERROR_MESSAGE}
        </p>

        <div className={css.footer}>
          <Button ref={dismissButtonRef} type="button" onClick={onClose}>
            Got it
          </Button>
        </div>
      </ModalBase>
    </ModalRoot>
  );
}

export default CartOrderLimitModal;
