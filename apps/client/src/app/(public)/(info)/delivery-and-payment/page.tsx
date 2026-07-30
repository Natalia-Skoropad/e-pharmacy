import { createPageMetadata } from '@/lib/seo/server';

import { InfoPage } from '@/components/info';
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
    <InfoPage
      title={DELIVERY_PAYMENT_INFO.title}
      description={DELIVERY_PAYMENT_INFO.description}
      activePath={DELIVERY_PAYMENT_INFO.path}
      updatedAt={DELIVERY_PAYMENT_INFO.updatedAt}
      highlights={DELIVERY_PAYMENT_INFO.highlights}
      sections={DELIVERY_PAYMENT_INFO.sections}
    />
  );
}

export default DeliveryAndPaymentPage;
