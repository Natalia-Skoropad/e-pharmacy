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

  return (
    <ProductRequestCategoryLabel
      name={name}
      icon={request.category ? (request.category.icon ?? 'pill') : undefined}
      custom={custom}
    />
  );
}

//===================================================================

// Reuse the exact chip in audit cells without inventing a catalog reference.
export function ProductRequestCategoryLabel({
  name,
  icon,
  custom = false,
  currentCatalogIcon = false,
}: Readonly<{
  name?: string;
  icon?: string;
  custom?: boolean;
  currentCatalogIcon?: boolean;
}>) {
  if (!name) return <span>—</span>;

  return (
    <span className={css.categoryCell}>
      {custom || icon ? (
        <span
          className={css.categoryIconWrap}
          title={currentCatalogIcon ? 'Icon from current catalog' : undefined}
        >
          {custom ? (
            <Settings size={16} aria-hidden="true" />
          ) : (
            <CategoryIcon name={icon} size={16} />
          )}
        </span>
      ) : null}
      <span className={css.categoryText}>{name}</span>
    </span>
  );
}
