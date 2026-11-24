import { Settings } from 'lucide-react';

import { CategoryIcon } from '@e-pharmacy/ui/forms';
import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';

import type { ProductRequestRowViewModel } from '@/lib/product-requests/product-requests';
import { resolveOwnerCatalogCategory } from '@/lib/products/owner-catalog-category';

import css from './ProductRequestCategory.module.css';

//===================================================================

type ProductRequestCategoryProps = Readonly<{
  request: Pick<
    ProductRequestRowViewModel,
    'categoryMode' | 'category' | 'customCategory'
  >;

  categoryDirectory: readonly ProductCategoryReference[];
}>;

//===================================================================

export function ProductRequestCategory({
  request,
  categoryDirectory,
}: ProductRequestCategoryProps) {
  const isCustomCategory = request.categoryMode === 'custom';

  const resolved = request.category
    ? resolveOwnerCatalogCategory(request.category, categoryDirectory)
    : undefined;

  const name = isCustomCategory
    ? request.customCategory?.trim()
    : resolved?.name;

  // A missing draft category must not render CategoryIcon's default icon.
  if (!name) return <span>—</span>;

  return (
    <span className={css.categoryCell}>
      <span className={css.categoryIconWrap}>
        {isCustomCategory ? (
          <Settings size={16} aria-hidden="true" />
        ) : (
          <CategoryIcon name={resolved?.icon} size={16} />
        )}
      </span>

      <span className={css.categoryText}>{name}</span>
    </span>
  );
}
