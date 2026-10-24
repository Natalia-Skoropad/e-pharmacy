import mongoose, { Types, type ClientSession } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../../../constants/admin/audit/admin-audit';

import { HTTP_STATUS } from '../../../constants/http/httpStatus';

import {
  PRODUCT_CATEGORY_DEFAULT_COLOR,
  createProductCategorySlugFromName,
  normalizeProductCategoryColor,
  normalizeProductCategoryNameKey,
} from '../../../constants/catalog/product-category';

import { ProductCategory } from '../../../models/catalog/productCategory.model';

import type {
  CreateAdminProductCategoryInput,
  UpdateAdminProductCategoryInput,
} from '../../../schemas/admin-settings.schema';

import type { AdminProductCategoryDto } from '../../../types/admin-settings';

import { httpError } from '../../../utils/httpError';
import { isMongoDuplicateKeyError } from '../../../utils/mongoError';
import { appendAdminAuditLog } from '../audit/admin-audit-write.service';

import {
  buildCategoryAuditSnapshot,
  serializeCategory,
  type LeanProductCategory,
} from './admin-settings-category-projection';

import { getCategoryUsageInSession } from './admin-settings-category-usage';

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
  input: CreateAdminProductCategoryInput,
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
            color: normalizeProductCategoryColor(input.color),
            icon: input.icon ?? 'pill',
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
          'color',
          'icon',
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
  input: UpdateAdminProductCategoryInput,
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
      const nextName = input.name.trim();
      const nextSlug = createProductCategorySlugFromName(input.name);
      const nextColor = normalizeProductCategoryColor(input.color);
      const nextIcon = input.icon ?? category.icon ?? 'pill';

      if (usage.total > 0) {
        throw httpError(
          HTTP_STATUS.CONFLICT,
          'This category is already in use and cannot be edited.'
        );
      }

      const previous = buildCategoryAuditSnapshot(category);
      const changedFields: string[] = [];

      if (category.name !== nextName) changedFields.push('name');
      if (category.slug !== nextSlug) changedFields.push('slug');

      if ((category.color ?? PRODUCT_CATEGORY_DEFAULT_COLOR) !== nextColor) {
        changedFields.push('color');
      }

      if ((category.icon ?? 'pill') !== nextIcon) changedFields.push('icon');

      if (changedFields.length === 0) {
        result = serializeCategory(
          category.toObject() as LeanProductCategory,
          usage
        );

        return;
      }

      category.name = input.name;
      category.slug = nextSlug;
      category.color = nextColor;
      category.icon = nextIcon;
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
          'color',
        ],

        requestId: auditRequestId,
        session,
      });
    });
  } finally {
    await session.endSession();
  }
}
