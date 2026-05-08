import { WalletCards } from 'lucide-react';

import css from './PaymentInfoCard.module.css';

//===================================================================

function PaymentInfoCard() {
  return (
    <article className={css.card}>
      <WalletCards className={css.icon} size={22} aria-hidden="true" />
      <div>
        <h2 className={css.title}>Payment</h2>
        <ul className={css.list}>
          <li>Payment on receipt.</li>
          <li>Payment by pharmacy bank account details.</li>
        </ul>
      </div>
    </article>
  );
}

export default PaymentInfoCard;
