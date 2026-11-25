import { Types, type ClientSession } from 'mongoose';

import { ProductCategory } from '../../../models/catalog/productCategory.model';
import type { AdminAuditValue } from '../../../types/admin/audit/admin-audit';

//===============================================================

type Snapshot = Record<string, AdminAuditValue>;

//===============================================================

// Preserve the category name at the time of writing new audit records. On
// legacy reads, explicitly mark names resolved from the current catalog.
// Never replace a stored snapshot name with a later category rename.
export async function resolveProductRequestAuditCategoryNames(
  before: Snapshot,
  after: Snapshot,
  options: Readonly<{ session?: ClientSession; legacyRead?: boolean }> = {}
): Promise<void> {
  const sides = [before, after].filter(
    (snapshot) =>
      (!Object.prototype.hasOwnProperty.call(snapshot, 'categoryName') ||
        !Object.prototype.hasOwnProperty.call(snapshot, 'categoryIcon')) &&
      snapshot.categoryMode !== 'custom' &&
      typeof snapshot.categoryId === 'string' &&
      Types.ObjectId.isValid(snapshot.categoryId)
  );

  if (!sides.length) return;

  const ids = [
    ...new Set(sides.map((snapshot) => String(snapshot.categoryId))),
  ];

  const categories = await ProductCategory.find({ _id: { $in: ids } })
    .select('_id name icon')
    .session(options.session ?? null)
    .lean<{ _id: Types.ObjectId; name: string; icon?: string }[]>();

  const references = new Map(
    categories.map((category) => [String(category._id), category])
  );

  for (const snapshot of sides) {
    const category = references.get(String(snapshot.categoryId));

    if (!Object.prototype.hasOwnProperty.call(snapshot, 'categoryName')) {
      snapshot.categoryName = category?.name
        ? options.legacyRead
          ? `${category.name} (current catalog name)`
          : category.name
        : null;
    }

    if (!Object.prototype.hasOwnProperty.call(snapshot, 'categoryIcon')) {
      snapshot.categoryIcon = category?.icon ?? null;

      if (category?.icon && options.legacyRead)
        snapshot.categoryIconSource = 'current_catalog';
    }
  }
}
