import { CartPageContent } from '@/components/cart';

import { CART_DESCRIPTION, CART_TITLE } from '@e-pharmacy/config/seo';
import { ROUTES } from '@e-pharmacy/config/routes';
import { createPageMetadata } from '@/lib/seo';

import { ProtectedRoute } from '@/routes';

//===================================================================

export const metadata = createPageMetadata({
  title: CART_TITLE,
  description: CART_DESCRIPTION,
  path: ROUTES.CART,
  noIndex: true,
});

//===================================================================

function CartPage() {
  return (
    <ProtectedRoute>
      <CartPageContent />
    </ProtectedRoute>
  );
}

export default CartPage;
