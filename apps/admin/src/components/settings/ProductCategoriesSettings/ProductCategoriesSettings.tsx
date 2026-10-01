'use client';

import { Boxes, LockKeyhole, Palette, Tags, Trash2 } from 'lucide-react';

import type { ProductCategoryListItem } from '@e-pharmacy/types/reference-data';

import {
  createAdminProductCategory,
  deleteAdminProductCategory,
  getAdminProductCategories,
  updateAdminProductCategory,
} from '@/lib/api/browser/admin-product-categories.api';

import { ADMIN_PERMISSIONS } from '@/lib/permissions/admin-permissions';

import { SettingsDictionaryPage } from '@/components/settings/SettingsDictionary/SettingsDictionaryPage';
import type { SettingsDictionaryConfig } from '@/components/settings/SettingsDictionary/settings-dictionary.types';

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
    pageIcon: <Tags size={23} aria-hidden="true" />,
    singularLabel: 'product category',
    pluralLabel: 'categories',
    addLabel: 'Додати категорію',
    infoTitle: 'Product categories',
    infoIcon: <Tags size={20} aria-hidden="true" />,
    infoItems: [
      {
        title: 'Where categories are used',
        description:
          'Categories organize products and product requests across the platform and are also used by catalog filters.',
        icon: <Boxes size={17} aria-hidden="true" />,
      },
      {
        title: 'Category color',
        description:
          'The selected color is presentation metadata used to distinguish categories visually in the interface.',
        icon: <Palette size={17} aria-hidden="true" />,
      },
      {
        title: 'Editing rules',
        description:
          'When a category is already used by products or product requests, editing is disabled so its name, slug, and color remain stable.',
        icon: <LockKeyhole size={17} aria-hidden="true" />,
      },
      {
        title: 'Safe deletion',
        description:
          'A category can be deleted only while it is unused. The backend checks usage again at deletion time.',
        icon: <Trash2 size={17} aria-hidden="true" />,
      },
    ],

    searchPlaceholder: 'Search product categories',
    appliedToColumnTitle: 'Applied to',
    renderUsage: renderCategoryUsage,

    usageLockMessage:
      'This category is used by products or product requests and cannot be edited or deleted.',

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
    },
  };

//===================================================================

export function ProductCategoriesSettings() {
  return <SettingsDictionaryPage config={PRODUCT_CATEGORIES_CONFIG} />;
}
