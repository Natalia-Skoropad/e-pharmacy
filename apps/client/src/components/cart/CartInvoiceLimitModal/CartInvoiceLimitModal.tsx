import { ConfirmActionModal } from '@/components/common';

import {
  CART_INVOICE_LIMIT_ERROR_MESSAGE,
  CART_INVOICE_LIMIT_MODAL_TITLE,
} from '@/lib/cart/invoice-limit';

//===================================================================

type CartInvoiceLimitModalProps = {
  onClose: () => void;
};

//===================================================================

function CartInvoiceLimitModal({ onClose }: CartInvoiceLimitModalProps) {
  return (
    <ConfirmActionModal
      title={CART_INVOICE_LIMIT_MODAL_TITLE}
      text={CART_INVOICE_LIMIT_ERROR_MESSAGE}
      confirmLabel="Got it"
      cancelLabel="Close"
      onConfirm={onClose}
      onCancel={onClose}
    />
  );
}

export default CartInvoiceLimitModal;
