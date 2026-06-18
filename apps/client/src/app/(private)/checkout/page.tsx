import { CheckoutPageContent } from '@/components/checkout';

import { CHECKOUT_DESCRIPTION, CHECKOUT_TITLE } from '@/lib/seo';
import { ROUTES } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

import { ProtectedRoute } from '@/routes';

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
