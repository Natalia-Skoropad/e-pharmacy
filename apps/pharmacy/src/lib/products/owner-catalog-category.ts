import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';

//===================================================================

/**
 * A product list can contain an older category snapshot without its icon.
 * The Admin-managed category directory is the source of truth for the icon.
 *
 * Prefer stable IDs; slug matching also supports older API representations.
 * Do not derive icons from names or hardcode the Admin category choices.
 */
export function resolveOwnerCatalogCategory(
  category: ProductCategoryReference,
  directory: readonly ProductCategoryReference[]
): ProductCategoryReference {
  const byId = directory.find((item) => item.id === category.id);
  const current = byId ?? directory.find((item) => item.slug === category.slug);

  if (!current) return category;

  return {
    ...category,
    ...current,

    // The product's own identity should not change in this display helper.
    id: category.id,
    slug: category.slug,
    icon: current.icon?.trim() || category.icon,
    color: current.color ?? category.color,
  };
}
