import { Position } from '../../../models/settings/position.model';

import type { AdminSettingsDictionaryListQuery } from '../../../schemas/admin/settings/admin-settings.schema';
import type { AdminPositionsListDto } from '../../../types/admin-settings';

import { createFlexibleSearchRegExp } from '../../../utils/regexp';
import { buildCreatedAtFilter } from './admin-settings-date-filters';

import {
  serializePosition,
  type LeanPosition,
} from './admin-settings-position-projection';

//===============================================================

export async function listAdminPositionsService(
  query: AdminSettingsDictionaryListQuery
): Promise<AdminPositionsListDto> {
  const filter: Record<string, unknown> = {};
  const keyword = query.keyword?.trim();
  const createdAt = buildCreatedAtFilter(query);

  if (keyword) filter.name = createFlexibleSearchRegExp(keyword);
  if (createdAt) filter.createdAt = createdAt;

  const skip = (query.page - 1) * query.perPage;

  const [total, positions, earliestPosition] = await Promise.all([
    Position.countDocuments(filter),

    Position.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(query.perPage)
      .lean<LeanPosition[]>(),

    Position.findOne({})
      .sort({ createdAt: 1, _id: 1 })
      .select('createdAt')
      .lean<{ createdAt: Date } | null>(),
  ]);

  return {
    items: positions.map(serializePosition),
    page: query.page,
    perPage: query.perPage,
    total,
    totalPages: Math.ceil(total / query.perPage),

    earliestCreatedAt: earliestPosition
      ? earliestPosition.createdAt.toISOString().slice(0, 10)
      : null,
  };
}
