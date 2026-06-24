import {
  CHECKOUT_DESCRIPTION,
  CHECKOUT_TITLE,
  createPageMetadata,
} from '@/lib/seo';

import { ROUTES } from '@/lib/routes';
import { ProtectedRoute } from '@/routes';

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
  return (
    <ProtectedRoute>
      <CheckoutPageContent />
    </ProtectedRoute>
  );
}

export default CheckoutPage;
