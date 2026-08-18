import { createPageMetadata } from '@/lib/seo/server';

import InfoPage from '@/components/info/InfoPage/InfoPage';
import { DELIVERY_PAYMENT_INFO, isInfoDocumentNoIndex } from '@/components/info/config';

//===================================================================

export const metadata = createPageMetadata({
  title: DELIVERY_PAYMENT_INFO.title,
  description: DELIVERY_PAYMENT_INFO.description,
  path: DELIVERY_PAYMENT_INFO.path,
  noIndex: isInfoDocumentNoIndex(DELIVERY_PAYMENT_INFO),
});

//===================================================================

function DeliveryAndPaymentPage() {
  return (
    <InfoPage data={DELIVERY_PAYMENT_INFO} />
  );
}

export default DeliveryAndPaymentPage;
