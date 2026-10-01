import mongoose, { Types, type ClientSession } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../constants/admin-audit';

import {
  createProductCategorySlugFromName,
  normalizeProductCategoryNameKey,
  type ProductCategoryKind,
  type ProductCategoryStatus,
} from '../constants/product-category';

import { HTTP_STATUS } from '../constants/httpStatus';
import { normalizeSettingsDictionaryNameKey } from '../constants/settings-dictionary';
import { Product } from '../models/product.model';
import { ProductCategory } from '../models/productCategory.model';
import { ProductRequest } from '../models/productRequest.model';
import { Position } from '../models/position.model';

import type {
  AdminProductCategoriesListDto,
  AdminProductCategoryDto,
  AdminPositionsListDto,
  AdminPositionDto,
  PositionUsageDto,
  ProductCategoryUsageDto,
} from '../types/admin-settings';

import type { ProductCategoryPersistenceEntity } from '../types/product-category';
import type { PositionPersistenceEntity } from '../types/position';

import type {
  AdminSettingsDictionaryListQuery,
  CreateAdminSettingsDictionaryItemInput,
  UpdateAdminSettingsDictionaryItemInput,
} from '../schemas/admin-settings.schema';

import { httpError } from '../utils/httpError';
import { isMongoDuplicateKeyError } from '../utils/mongoError';
import { createFlexibleSearchRegExp } from '../utils/regexp';
import { appendAdminAuditLog } from './admin-audit.service';

//===============================================================

type LeanProductCategory = ProductCategoryPersistenceEntity & {
  _id: Types.ObjectId;
};

type LeanPosition = PositionPersistenceEntity & {
  _id: Types.ObjectId;
};

type UsageAggregationRow = Readonly<{
  _id: Types.ObjectId;
  count: number;
}>;

//===============================================================

function startOfUtcDay(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

//===============================================================

function endOfUtcDay(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}

//===============================================================

function buildCreatedAtFilter(
  query: AdminSettingsDictionaryListQuery
): Record<string, unknown> | undefined {
  if (!query.createdFrom && !query.createdTo) return undefined;

  return {
    ...(query.createdFrom ? { $gte: startOfUtcDay(query.createdFrom) } : {}),
    ...(query.createdTo ? { $lte: endOfUtcDay(query.createdTo) } : {}),
  };
}

//===============================================================

function zeroPositionUsage(): PositionUsageDto {
  return { employeesCount: 0, total: 0 };
}

//===============================================================

async function getCategoryUsageMap(
  categoryIds: readonly Types.ObjectId[]
): Promise<Map<string, ProductCategoryUsageDto>> {
  if (categoryIds.length === 0) return new Map();

  const [productRows, requestRows] = await Promise.all([
    Product.aggregate<UsageAggregationRow>([
      { $match: { categoryId: { $in: categoryIds } } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]),
    ProductRequest.aggregate<UsageAggregationRow>([
      { $match: { categoryId: { $in: categoryIds } } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]),
  ]);

  const productCounts = new Map(
    productRows.map((row) => [String(row._id), row.count])
  );
  const requestCounts = new Map(
    requestRows.map((row) => [String(row._id), row.count])
  );

  return new Map(
    categoryIds.map((categoryId) => {
      const key = String(categoryId);
      const productsCount = productCounts.get(key) ?? 0;
      const productRequestsCount = requestCounts.get(key) ?? 0;

      return [
        key,
        {
          productsCount,
          productRequestsCount,
          total: productsCount + productRequestsCount,
        },
      ];
    })
  );
}

//===============================================================

async function getCategoryUsageInSession(
  categoryId: Types.ObjectId,
  session: ClientSession
): Promise<ProductCategoryUsageDto> {
  const [productsCount, productRequestsCount] = await Promise.all([
    Product.countDocuments({ categoryId }).session(session),
    ProductRequest.countDocuments({ categoryId }).session(session),
  ]);

  return {
    productsCount,
    productRequestsCount,
    total: productsCount + productRequestsCount,
  };
}

//===============================================================

function serializeCategory(
  category: LeanProductCategory,
  usage: ProductCategoryUsageDto
): AdminProductCategoryDto {
  return {
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    status: category.status,
    kind: category.kind,
    sortOrder: category.sortOrder,
    usage,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

//===============================================================

function serializePosition(position: LeanPosition): AdminPositionDto {
  return {
    id: String(position._id),
    name: position.name,
    usage: zeroPositionUsage(),
    createdAt: position.createdAt.toISOString(),
    updatedAt: position.updatedAt.toISOString(),
  };
}

//===============================================================

function buildCategoryAuditSnapshot(category: {
  name: string;
  slug: string;
  status: ProductCategoryStatus;
  kind: ProductCategoryKind;
  sortOrder: number;
}) {
  return {
    name: category.name,
    slug: category.slug,
    status: category.status,
    kind: category.kind,
    sortOrder: category.sortOrder,
  };
}

//===============================================================

function throwCategoryDuplicate(error: unknown): never {
  if (isMongoDuplicateKeyError(error)) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'A category with this name already exists.'
    );
  }

  throw error;
}

//===============================================================

function throwPositionDuplicate(error: unknown): never {
  if (isMongoDuplicateKeyError(error)) {
    throw httpError(
      HTTP_STATUS.CONFLICT,
      'A position with this name already exists.'
    );
  }

  throw error;
}

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

//===============================================================

async function getNextCategorySortOrder(
  session: ClientSession
): Promise<number> {
  const latest = await ProductCategory.findOne({})
    .sort({ sortOrder: -1, _id: -1 })
    .select('sortOrder')
    .session(session)
    .lean<{ sortOrder: number } | null>();

  return (latest?.sortOrder ?? 0) + 10;
}

//===============================================================

export async function createAdminProductCategoryService(
  input: CreateAdminSettingsDictionaryItemInput,
  adminUserId: string,
  auditRequestId: string
): Promise<AdminProductCategoryDto> {
  const session = await mongoose.startSession();
  let result: AdminProductCategoryDto | null = null;

  try {
    await session.withTransaction(async () => {
      const sortOrder = await getNextCategorySortOrder(session);
      const slug = createProductCategorySlugFromName(input.name);

      const [category] = await ProductCategory.create(
        [
          {
            name: input.name,
            normalizedName: normalizeProductCategoryNameKey(input.name),
            slug,
            status: 'active',
            kind: 'standard',
            sortOrder,
            createdBy: adminUserId,
            updatedBy: adminUserId,
          },
        ],
        { session }
      );

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action: ADMIN_AUDIT_ACTIONS.PRODUCT_CATEGORY_CREATED,
        section: ADMIN_AUDIT_SECTIONS.CATEGORIES,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PRODUCT_CATEGORY,
        entityId: String(category._id),
        entityLabel: category.name,
        before: { exists: false },
        after: { exists: true, ...buildCategoryAuditSnapshot(category) },
        changedFields: [
          'exists',
          'name',
          'slug',
          'status',
          'kind',
          'sortOrder',
        ],
        requestId: auditRequestId,
        session,
      });

      result = serializeCategory(category.toObject() as LeanProductCategory, {
        productsCount: 0,
        productRequestsCount: 0,
        total: 0,
      });
    });
  } catch (error) {
    throwCategoryDuplicate(error);
  } finally {
    await session.endSession();
  }

  if (!result) {
    throw new Error('Product category creation transaction did not commit.');
  }

  return result;
}

//===============================================================

export async function updateAdminProductCategoryService(
  categoryId: string,
  input: UpdateAdminSettingsDictionaryItemInput,
  adminUserId: string,
  auditRequestId: string
): Promise<AdminProductCategoryDto> {
  const session = await mongoose.startSession();
  let result: AdminProductCategoryDto | null = null;

  try {
    await session.withTransaction(async () => {
      const category =
        await ProductCategory.findById(categoryId).session(session);

      if (!category) {
        throw httpError(
          HTTP_STATUS.NOT_FOUND,
          'Product category was not found.'
        );
      }

      const usage = await getCategoryUsageInSession(category._id, session);

      if (usage.total > 0) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'This category is already in use and cannot be edited.'
        );
      }

      const nextSlug = createProductCategorySlugFromName(input.name);
      const previous = buildCategoryAuditSnapshot(category);
      const changedFields: string[] = [];

      if (category.name !== input.name.trim()) changedFields.push('name');
      if (category.slug !== nextSlug) changedFields.push('slug');

      if (changedFields.length === 0) {
        result = serializeCategory(
          category.toObject() as LeanProductCategory,
          usage
        );
        return;
      }

      category.name = input.name;
      category.slug = nextSlug;
      category.updatedBy = new Types.ObjectId(adminUserId);
      await category.save({ session });

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action: ADMIN_AUDIT_ACTIONS.PRODUCT_CATEGORY_UPDATED,
        section: ADMIN_AUDIT_SECTIONS.CATEGORIES,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PRODUCT_CATEGORY,
        entityId: String(category._id),
        entityLabel: category.name,
        before: previous,
        after: buildCategoryAuditSnapshot(category),
        changedFields,
        requestId: auditRequestId,
        session,
      });

      result = serializeCategory(
        category.toObject() as LeanProductCategory,
        usage
      );
    });
  } catch (error) {
    throwCategoryDuplicate(error);
  } finally {
    await session.endSession();
  }

  if (!result) {
    throw new Error('Product category update transaction did not commit.');
  }

  return result;
}

//===============================================================

export async function deleteAdminProductCategoryService(
  categoryId: string,
  adminUserId: string,
  auditRequestId: string
): Promise<void> {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const category =
        await ProductCategory.findById(categoryId).session(session);

      if (!category) {
        throw httpError(
          HTTP_STATUS.NOT_FOUND,
          'Product category was not found.'
        );
      }

      const usage = await getCategoryUsageInSession(category._id, session);

      if (usage.total > 0) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'This category is already in use and cannot be deleted.'
        );
      }

      const before = buildCategoryAuditSnapshot(category);
      await ProductCategory.deleteOne({ _id: category._id }).session(session);

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action: ADMIN_AUDIT_ACTIONS.PRODUCT_CATEGORY_DELETED,
        section: ADMIN_AUDIT_SECTIONS.CATEGORIES,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.PRODUCT_CATEGORY,
        entityId: String(category._id),
        entityLabel: category.name,
        before: { exists: true, ...before },
        after: { exists: false },
        changedFields: [
          'exists',
          'name',
          'slug',
          'status',
          'kind',
          'sortOrder',
        ],
        requestId: auditRequestId,
        session,
      });
    });
  } finally {
    await session.endSession();
  }
}

//===============================================================

export async function createAdminPositionService(
  input: CreateAdminSettingsDictionaryItemInput,
  adminUserId: string,
  auditRequestId: string
): Promise<AdminPositionDto> {
  const session = await mongoose.startSession();
  let result: AdminPositionDto | null = null;

  try {
    await session.withTransaction(async () => {
      const [position] = await Position.create(
        [
          {
            name: input.name,
            normalizedName: normalizeSettingsDictionaryNameKey(input.name),
            createdBy: adminUserId,
            updatedBy: adminUserId,
          },
        ],
        { session }
      );

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action: ADMIN_AUDIT_ACTIONS.POSITION_CREATED,
        section: ADMIN_AUDIT_SECTIONS.POSITIONS,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.POSITION,
        entityId: String(position._id),
        entityLabel: position.name,
        before: { exists: false },
        after: { exists: true, name: position.name },
        changedFields: ['exists', 'name'],
        requestId: auditRequestId,
        session,
      });

      result = serializePosition(position.toObject() as LeanPosition);
    });
  } catch (error) {
    throwPositionDuplicate(error);
  } finally {
    await session.endSession();
  }

  if (!result) {
    throw new Error('Position creation transaction did not commit.');
  }

  return result;
}

//===============================================================

export async function updateAdminPositionService(
  positionId: string,
  input: UpdateAdminSettingsDictionaryItemInput,
  adminUserId: string,
  auditRequestId: string
): Promise<AdminPositionDto> {
  const session = await mongoose.startSession();
  let result: AdminPositionDto | null = null;

  try {
    await session.withTransaction(async () => {
      const position = await Position.findById(positionId).session(session);

      if (!position) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Position was not found.');
      }

      const usage = zeroPositionUsage();

      if (usage.total > 0) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'This position is already in use and cannot be edited.'
        );
      }

      const nextName = input.name.trim();

      if (position.name === nextName) {
        result = serializePosition(position.toObject() as LeanPosition);
        return;
      }

      const previousName = position.name;
      position.name = input.name;
      position.updatedBy = new Types.ObjectId(adminUserId);
      await position.save({ session });

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action: ADMIN_AUDIT_ACTIONS.POSITION_UPDATED,
        section: ADMIN_AUDIT_SECTIONS.POSITIONS,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.POSITION,
        entityId: String(position._id),
        entityLabel: position.name,
        before: { name: previousName },
        after: { name: position.name },
        changedFields: ['name'],
        requestId: auditRequestId,
        session,
      });

      result = serializePosition(position.toObject() as LeanPosition);
    });
  } catch (error) {
    throwPositionDuplicate(error);
  } finally {
    await session.endSession();
  }

  if (!result) {
    throw new Error('Position update transaction did not commit.');
  }

  return result;
}

//===============================================================

export async function deleteAdminPositionService(
  positionId: string,
  adminUserId: string,
  auditRequestId: string
): Promise<void> {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const position = await Position.findById(positionId).session(session);

      if (!position) {
        throw httpError(HTTP_STATUS.NOT_FOUND, 'Position was not found.');
      }

      const usage = zeroPositionUsage();

      if (usage.total > 0) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'This position is already in use and cannot be deleted.'
        );
      }

      await Position.deleteOne({ _id: position._id }).session(session);

      await appendAdminAuditLog({
        actorUserId: adminUserId,
        action: ADMIN_AUDIT_ACTIONS.POSITION_DELETED,
        section: ADMIN_AUDIT_SECTIONS.POSITIONS,
        entityType: ADMIN_AUDIT_ENTITY_TYPES.POSITION,
        entityId: String(position._id),
        entityLabel: position.name,
        before: { exists: true, name: position.name },
        after: { exists: false },
        changedFields: ['exists', 'name'],
        requestId: auditRequestId,
        session,
      });
    });
  } finally {
    await session.endSession();
  }
}
