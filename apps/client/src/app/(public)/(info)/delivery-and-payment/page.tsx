import { createPageMetadata } from '@/lib/seo/server';

import InfoPage from '@/components/info/InfoPage/InfoPage';
import { DELIVERY_PAYMENT_INFO } from '@/components/info/config';

//===================================================================

export const metadata = createPageMetadata({
  title: DELIVERY_PAYMENT_INFO.title,
  description: DELIVERY_PAYMENT_INFO.description,
  path: DELIVERY_PAYMENT_INFO.path,
});

//===================================================================

function DeliveryAndPaymentPage() {
  return (
    <InfoPage data={DELIVERY_PAYMENT_INFO} />
  );
}

export default DeliveryAndPaymentPage;
