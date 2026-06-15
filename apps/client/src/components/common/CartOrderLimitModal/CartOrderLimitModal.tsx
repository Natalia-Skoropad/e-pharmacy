import { ConfirmationModal } from '@e-pharmacy/ui/modals';

import {
  CART_ORDER_LIMIT_ERROR_MESSAGE,
  CART_ORDER_LIMIT_MODAL_TITLE,
} from '@/lib/cart/order-limit';

//===================================================================

type CartOrderLimitModalProps = {
  onClose: () => void;
};

//===================================================================

function CartOrderLimitModal({ onClose }: CartOrderLimitModalProps) {
  return (
    <ConfirmationModal
      title={CART_ORDER_LIMIT_MODAL_TITLE}
      text={CART_ORDER_LIMIT_ERROR_MESSAGE}
      confirmLabel="Got it"
      cancelLabel="Close"
      onConfirm={onClose}
      onCancel={onClose}
    />
  );
}

export default CartOrderLimitModal;
