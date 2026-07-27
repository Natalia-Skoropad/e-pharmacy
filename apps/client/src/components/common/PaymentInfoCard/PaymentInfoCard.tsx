import { WalletCards } from 'lucide-react';

import { PAYMENT_METHOD_LABELS } from '@e-pharmacy/config/presentation';

import css from './PaymentInfoCard.module.css';

//===================================================================

function PaymentInfoCard() {
  return (
    <article className={css.card}>
      <WalletCards className={css.icon} size={22} aria-hidden="true" />
      <div>
        <h2 className={css.title}>Payment</h2>
        <ul className={css.list}>
          <li>{PAYMENT_METHOD_LABELS.cash}.</li>
          <li>{PAYMENT_METHOD_LABELS.bank_transfer}.</li>
        </ul>
      </div>
    </article>
  );
}

export default PaymentInfoCard;
