import { CartPageContent } from '@/components/cart';

import { CART_DESCRIPTION, CART_TITLE } from '@/lib/seo';
import { ROUTES } from '@/lib/routes';
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
