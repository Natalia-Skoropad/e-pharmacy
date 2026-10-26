import { ProductCategory } from '../../../models/catalog/productCategory.model';

import type { AdminSettingsDictionaryListQuery } from '../../../schemas/admin/settings/admin-settings.schema';
import type { AdminProductCategoriesListDto } from '../../../types/admin/settings/admin-settings';

import { createFlexibleSearchRegExp } from '../../../utils/validation/regexp';

import {
  serializeCategory,
  type LeanProductCategory,
} from './admin-settings-category-projection';

import { getCategoryUsageMap } from './admin-settings-category-usage';
import { buildCreatedAtFilter } from './admin-settings-date-filters';

//===============================================================

export async function listAdminProductCategoriesService(
  query: AdminSettingsDictionaryListQuery
): Promise<AdminProductCategoriesListDto> {
  const filter: Record<string, unknown> = {};
  const keyword = query.keyword?.trim();
  const createdAt = buildCreatedAtFilter(query);

  if (keyword) filter.name = createFlexibleSearchRegExp(keyword);
  if (createdAt) filter.createdAt = createdAt;

  const skip = (query.page - 1) * query.perPage;

  const [total, categories, earliestCategory] = await Promise.all([
    ProductCategory.countDocuments(filter),

    ProductCategory.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(query.perPage)
      .lean<LeanProductCategory[]>(),

    ProductCategory.findOne({})
      .sort({ createdAt: 1, _id: 1 })
      .select('createdAt')
      .lean<{ createdAt: Date } | null>(),
  ]);

  const usage = await getCategoryUsageMap(
    categories.map((category) => category._id)
  );

  return {
    items: categories.map((category) =>
      serializeCategory(
        category,

        usage.get(String(category._id)) ?? {
          productsCount: 0,
          productRequestsCount: 0,
          total: 0,
        }
      )
    ),

    page: query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),

    earliestCreatedAt: earliestCategory
      ? earliestCategory.createdAt.toISOString().slice(0, 10)
      : null,
  };
}
