import { ProtectedRoute } from '@/components/auth';
import { CartPageContent } from '@/components/cart';

import { CART_DESCRIPTION, CART_TITLE } from '@/lib/constants/metadata';
import { createPageMetadata } from '@/lib/seo';

//===================================================================

export const metadata = createPageMetadata({
  title: CART_TITLE,
  description: CART_DESCRIPTION,
  path: '/cart',
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
