import { PagePlaceholder } from '@/components/common';

import { CHECKOUT_DESCRIPTION, CHECKOUT_TITLE } from '@/lib/constants/metadata';
import { createBreadcrumbs } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

//===================================================================

export const metadata = createPageMetadata({
  title: CHECKOUT_TITLE,
  description: CHECKOUT_DESCRIPTION,
  path: '/checkout',
  noIndex: true,
});

//===================================================================

function CheckoutPage() {
  return (
    <PagePlaceholder
      title={CHECKOUT_TITLE}
      text={CHECKOUT_DESCRIPTION}
      breadcrumbs={createBreadcrumbs(CHECKOUT_TITLE)}
    />
  );
}

export default CheckoutPage;
