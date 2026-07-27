import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@e-pharmacy/config/presentation';

import { ROUTES } from '@/lib/routes';

//===================================================================

export const DELIVERY_PAYMENT_INFO = {
  path: ROUTES.DELIVERY_PAYMENT,
  title: 'Delivery and Payment',
  description:
    'Learn how E-PHARMACY orders are prepared, how pickup works, and which payment options can be used with partner pharmacies.',
  updatedAt: 'May 2026',
  highlights: [
    {
      title: 'Delivery',
      text: 'Pick up from a selected pharmacy or use postal delivery after the pharmacy confirms the order details.',
    },
    {
      title: 'Payment',
      text: 'Pay on receipt or use the bank account details provided by the selected pharmacy.',
    },
  ],
  sections: [
    {
      title: 'How the service works',
      content: [
        'E-PHARMACY is an online pharmacy platform that helps clients find products, compare pharmacy offers, and prepare online orders. The platform provides information about products, partner pharmacies, prices, availability, ratings, and order details.',
        'The final sale and product handover are completed by the selected licensed pharmacy. E-PHARMACY helps organize the order flow but does not replace the pharmacy that provides the product.',
      ],
    },
    {
      title: DELIVERY_METHOD_LABELS.pickup,
      content: [
        'When pickup is selected, the order is prepared by the chosen pharmacy. The client can review the pharmacy address, phone number, working hours, and order summary before confirmation.',
        'The pharmacy may contact the client to clarify availability, pickup time, or order details.',
      ],
    },
    {
      title: DELIVERY_METHOD_LABELS.postal_delivery,
      content: [
        `${DELIVERY_METHOD_LABELS.postal_delivery} can be selected during checkout when the pharmacy supports it. The client provides name, phone number, delivery address or post office details, and any useful order comment.`,
        'The pharmacy confirms the address and delivery details before handing the order to a carrier. Delivery price depends on the selected carrier and pharmacy conditions.',
      ],
    },
    {
      title: PAYMENT_METHOD_LABELS.cash,
      content: [
        `${PAYMENT_METHOD_LABELS.cash} means the client pays when the order is received or picked up, according to the payment methods available at the selected pharmacy.`,
        'The client should check the final amount and product list before payment, especially when the order contains items from more than one pharmacy.',
      ],
    },
    {
      title: PAYMENT_METHOD_LABELS.bank_transfer,
      content: [
        'Some pharmacies can provide bank account details for payment. In this case, the payment information is shown in the pharmacy details or checkout flow when available.',
        'The payment purpose, recipient, and account details should be copied carefully. If something looks unclear, the client should contact the pharmacy before paying.',
      ],
    },
  ],
} as const;
