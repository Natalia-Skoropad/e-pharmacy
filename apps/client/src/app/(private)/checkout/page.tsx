import {
  CHECKOUT_DESCRIPTION,
  CHECKOUT_TITLE,
  createPageMetadata,
} from '@/lib/seo';

import { ROUTES } from '@/lib/routes';
import { CheckoutPageContent } from '@/components/checkout';

//===================================================================

export const metadata = createPageMetadata({
  title: CHECKOUT_TITLE,
  description: CHECKOUT_DESCRIPTION,
  path: ROUTES.CHECKOUT,
  noIndex: true,
});

//===================================================================

function CheckoutPage() {
  return <CheckoutPageContent />;
}

export default CheckoutPage;
