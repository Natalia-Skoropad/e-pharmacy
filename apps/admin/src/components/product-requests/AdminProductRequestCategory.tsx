import { Settings } from 'lucide-react';

import { CategoryIcon } from '@e-pharmacy/ui/forms';

import type { ProductRequestRowViewModel } from '@/lib/product-requests/admin-product-requests';

import css from './AdminProductRequestsList.module.css';

//===================================================================

// Same category chip as the Pharmacy request list and overview.
export function AdminProductRequestCategory({
  request,
}: Readonly<{
  request: Pick<
    ProductRequestRowViewModel,
    'categoryMode' | 'category' | 'customCategory'
  >;
}>) {
  const custom = request.categoryMode === 'custom' && !request.category;

  const name = (
    custom ? request.customCategory : request.category?.name
  )?.trim();

  if (!name) return <span>—</span>;

  return (
    <span className={css.categoryCell}>
      <span className={css.categoryIconWrap}>
        {custom ? (
          <Settings size={16} aria-hidden="true" />
        ) : (
          <CategoryIcon name={request.category?.icon} size={16} />
        )}
      </span>
      <span className={css.categoryText}>{name}</span>
    </span>
  );
}
