import { CART_DESCRIPTION, CART_TITLE, createPageMetadata } from '@/lib/seo';
import { ROUTES } from '@/lib/routes';
import { ProtectedRoute } from '@/routes';

import { CartPageContent } from '@/components/cart';

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
