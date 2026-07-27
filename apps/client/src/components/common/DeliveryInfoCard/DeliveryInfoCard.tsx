import { Car } from 'lucide-react';

import { DELIVERY_METHOD_LABELS } from '@e-pharmacy/config/presentation';

import css from './DeliveryInfoCard.module.css';

//===================================================================

function DeliveryInfoCard() {
  return (
    <article className={css.card}>
      <Car className={css.icon} size={22} aria-hidden="true" />
      <div>
        <h2 className={css.title}>Delivery</h2>
        <ul className={css.list}>
          <li>{DELIVERY_METHOD_LABELS.pickup}.</li>
          <li>
            {DELIVERY_METHOD_LABELS.postal_delivery} after a pharmacy call to
            confirm the address.
          </li>
        </ul>
        <p className={css.notice}>Delivery price depends on the carrier.</p>
      </div>
    </article>
  );
}

export default DeliveryInfoCard;
