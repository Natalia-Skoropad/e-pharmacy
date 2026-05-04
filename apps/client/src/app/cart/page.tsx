import { PagePlaceholder } from '@/components/common';

import { CART_DESCRIPTION, CART_TITLE } from '@/lib/constants/metadata';
import { createBreadcrumbs } from '@/lib/routes';
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
    <PagePlaceholder
      title={CART_TITLE}
      text={CART_DESCRIPTION}
      breadcrumbs={createBreadcrumbs(CART_TITLE)}
    />
  );
}

export default CartPage;
