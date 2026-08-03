import { Car, WalletCards } from 'lucide-react';

import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@e-pharmacy/config/presentation';

import { ProductOrderInfoCard } from './ProductOrderInfoCard';
import css from './ProductOrderInformationPanel.module.css';

//===================================================================

export function ProductOrderInformationPanel() {
  return (
    <div className={css.grid}>
      <ProductOrderInfoCard
        icon={<Car size={22} />}
        title="Delivery"
        items={[
          `${DELIVERY_METHOD_LABELS.pickup}.`,
          `${DELIVERY_METHOD_LABELS.postal_delivery} after a pharmacy confirms the address.`,
        ]}
        notice="Delivery availability and price depend on pharmacy and carrier confirmation."
      />

      <ProductOrderInfoCard
        icon={<WalletCards size={22} />}
        title="Payment"
        items={[
          `${PAYMENT_METHOD_LABELS.cash}.`,
          `${PAYMENT_METHOD_LABELS.bank_transfer}.`,
        ]}
      />
    </div>
  );
}
