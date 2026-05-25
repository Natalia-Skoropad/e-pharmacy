import { ShieldAlert } from 'lucide-react';

import { Button } from '@/components/common';
import { formatPrice } from '@/lib/formatters';
import type { CheckoutStoreOrderGroup } from '@/types/checkout';

import css from './CheckoutInvoicePanel.module.css';

//===================================================================

type CheckoutInvoicePanelProps = {
  orderGroup: CheckoutStoreOrderGroup;
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
};

//===================================================================

function CheckoutInvoicePanel({
  orderGroup,
  canSubmit,
  isSubmitting,
  onSubmit,
}: CheckoutInvoicePanelProps) {
  return (
    <aside className={css.panel} aria-labelledby="invoice-title">
      <h2 className={css.title} id="invoice-title">
        Pharmacy invoice
      </h2>

      <div className={css.invoiceCard}>
        <h3>{orderGroup.storeName}</h3>
      </div>

      <div className={css.policyNotice}>
        <ShieldAlert size={20} aria-hidden="true" />
        <p>
          Medicines and pharmacy products are non-returnable and
          non-exchangeable after confirmation. Please check the invoice
          carefully before payment.
        </p>
      </div>

      <dl className={css.totalList}>
        <div>
          <dt>Total items</dt>
          <dd>{orderGroup.totalItems}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{formatPrice(orderGroup.totalPrice)}</dd>
        </div>
      </dl>

      <Button type="button" fullWidth disabled={!canSubmit} onClick={onSubmit}>
        {isSubmitting ? 'Confirming...' : 'Confirm invoice'}
      </Button>
    </aside>
  );
}

export default CheckoutInvoicePanel;
