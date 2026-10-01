'use client';

import type { ProductCategoryListItem } from '@e-pharmacy/types/reference-data';

import { SettingsDictionaryPage } from '@/components/settings/SettingsDictionary/SettingsDictionaryPage';
import type { SettingsDictionaryConfig } from '@/components/settings/SettingsDictionary/settings-dictionary.types';

import {
  createAdminProductCategory,
  deleteAdminProductCategory,
  getAdminProductCategories,
  updateAdminProductCategory,
} from '@/lib/api/browser/admin-product-categories.api';

import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

//===================================================================

const DEFAULT_CATEGORY_COLOR = '#64748B';

//===================================================================

function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function renderCategoryUsage(item: ProductCategoryListItem): string {
  const { productsCount, productRequestsCount } = item.usage;

  if (productsCount === 0 && productRequestsCount === 0) {
    return 'Not applied';
  }

  const labels: string[] = [];

  if (productsCount > 0) {
    labels.push(formatCount(productsCount, 'product', 'products'));
  }

  if (productRequestsCount > 0) {
    labels.push(
      formatCount(productRequestsCount, 'product request', 'product requests')
    );
  }

  return labels.join(' · ');
}

//===================================================================

const PRODUCT_CATEGORIES_CONFIG: SettingsDictionaryConfig<ProductCategoryListItem> =
  {
    title: 'Product categories',
    singularLabel: 'product category',
    pluralLabel: 'categories',
    infoTitle: 'Product categories',

    infoDescription:
      'Categories are used by products and product requests across the platform. Categories that are already in use cannot be renamed or deleted, but their display color can still be updated.',

    searchPlaceholder: 'Search product categories',
    appliedToColumnTitle: 'Applied to',
    renderUsage: renderCategoryUsage,

    usageLockMessage:
      'This category is used by products or product requests. Its name cannot be edited and the category cannot be deleted.',

    emptyLabel: 'No product categories have been created yet.',

    filteredEmptyLabel:
      'No product categories match the current search or filters.',

    permissions: {
      create: ADMIN_PERMISSIONS.categories.create,
      edit: ADMIN_PERMISSIONS.categories.edit,
      delete: ADMIN_PERMISSIONS.categories.delete,
    },

    messages: {
      created: 'Product category was created successfully.',
      updated: 'Product category was updated successfully.',
      deleted: 'Product category was deleted successfully.',
    },

    api: {
      list: getAdminProductCategories,
      create: async ({ name, color }) => {
        if (!color) {
          throw new TypeError('Product category color is required.');
        }

        return createAdminProductCategory({ name, color });
      },
      update: async (categoryId, { name, color }) => {
        if (!color) {
          throw new TypeError('Product category color is required.');
        }

        return updateAdminProductCategory(categoryId, { name, color });
      },
      delete: deleteAdminProductCategory,
    },

    color: {
      defaultColor: DEFAULT_CATEGORY_COLOR,
      getColor: (item) => item.color,
      allowColorEditWhenInUse: true,
    },
  };

//===================================================================

export function ProductCategoriesSettings() {
  return <SettingsDictionaryPage config={PRODUCT_CATEGORIES_CONFIG} />;
}
