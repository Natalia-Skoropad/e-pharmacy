import { useMemo } from 'react';
import { Plus } from 'lucide-react';

import { PRODUCT_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import type { EntityId } from '@e-pharmacy/types/primitives';
import type { ProductDetails } from '@e-pharmacy/types/products';
import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';

import { CategoryIcon } from '@e-pharmacy/ui/forms';

import {
  DataTable,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { Button, TextActionButton } from '@e-pharmacy/ui/primitives';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { getProductImageSrc } from '@/lib/products/product-images';
import { resolveOwnerCatalogCategory } from '@/lib/products/owner-catalog-category';
import { getPharmacyAllProductPath } from '@/lib/routes';

import css from './AllProductsTable.module.css';

//===================================================================

type AllProductsTableProps = Readonly<{
  currentPharmacyId?: EntityId | null;
  products: ProductDetails[];
  categoryDirectory: readonly ProductCategoryReference[];
  emptyMessage: string;
  isLoading?: boolean;
  isAddActionDisabled?: boolean;
  addingProductId?: EntityId | null;
  onAddProduct?: (product: ProductDetails) => void;
}>;

//===================================================================

function isProductAddedToCurrentPharmacy(
  product: ProductDetails,
  currentPharmacyId: EntityId | null | undefined
): boolean {
  if (typeof product.isAddedToOwner === 'boolean')
    return product.isAddedToOwner;

  if (!currentPharmacyId) return false;

  return product.offers.some(
    (offer) => String(offer.pharmacyId) === String(currentPharmacyId)
  );
}

//===================================================================

function getActionLabel(
  product: ProductDetails,
  isAddedToCurrentPharmacy: boolean
) {
  if (isAddedToCurrentPharmacy) return 'Added to your pharmacies';
  if (product.status === 'blocked') return 'Unavailable';

  return 'Add to pharmacy';
}

//===================================================================

function renderCategory(
  product: ProductDetails,
  categoryDirectory: readonly ProductCategoryReference[]
) {
  const category = resolveOwnerCatalogCategory(
    product.category,
    categoryDirectory
  );

  return (
    <span className={css.categoryCell}>
      <span className={css.categoryIconWrap}>
        <CategoryIcon name={category.icon} size={16} />
      </span>
      <span className={css.categoryText}>{category.name}</span>
    </span>
  );
}

//===================================================================

function AllProductsTable({
  currentPharmacyId,
  products,
  categoryDirectory,
  emptyMessage,
  isLoading = false,
  isAddActionDisabled = false,
  addingProductId = null,
  onAddProduct,
}: AllProductsTableProps) {
  const columns = useMemo<Array<DataTableColumn<ProductDetails>>>(
    () => [
      {
        key: 'createdAt',
        title: <TableHeaderTitle parts={['Created', 'date']} />,

        render: (product) =>
          product.createdAt ? <TableDateTime value={product.createdAt} /> : '—',
      },
      {
        key: 'productPhoto',
        title: <TableHeaderTitle parts={['Product', 'photo']} />,

        render: (product) => (
          <TableImagePreview
            src={getProductImageSrc(product.imageUrl)}
            alt={`${product.name} photo`}
            fallback={product.name.charAt(0)}
          />
        ),
      },
      {
        key: 'productId',
        title: <TableHeaderTitle parts={['Product', 'ID']} />,
        width: '126px',

        render: (product) => (
          <TextActionButton
            className={css.breakableLink}
            href={getPharmacyAllProductPath(product.id)}
          >
            {product.id}
          </TextActionButton>
        ),
      },
      {
        key: 'article',
        title: <TableHeaderTitle parts={['Product', 'article']} />,

        render: (product) => (
          <TextActionButton href={getPharmacyAllProductPath(product.id)}>
            {product.article}
          </TextActionButton>
        ),
      },
      {
        key: 'name',
        title: <TableHeaderTitle parts={['Product', 'name']} />,

        render: (product) => (
          <TextActionButton href={getPharmacyAllProductPath(product.id)}>
            {product.name}
          </TextActionButton>
        ),
      },
      {
        key: 'category',
        title: <TableHeaderTitle parts={['Product', 'category']} />,
        render: (product) => renderCategory(product, categoryDirectory),
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Product', 'status']} />,
        render: (product) => (
          <StatusBadge {...PRODUCT_STATUS_PRESENTATION[product.status]} />
        ),
      },
      {
        key: 'addedToMyPharmacy',
        title: <TableHeaderTitle parts={['Added to', 'pharmacy']} />,

        render: (product) =>
          isProductAddedToCurrentPharmacy(product, currentPharmacyId)
            ? 'Yes'
            : 'No',
      },
      {
        key: 'action',
        title: 'Action',

        render: (product) => {
          const isAddedToCurrentPharmacy = isProductAddedToCurrentPharmacy(
            product,
            currentPharmacyId
          );

          const canAddProduct =
            product.status === 'active' &&
            !isAddedToCurrentPharmacy &&
            !isAddActionDisabled &&
            Boolean(onAddProduct);

          return (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className={css.addButton}
              disabled={!canAddProduct}
              isLoading={addingProductId === product.id}
              loadingLabel="Adding..."
              iconLeft={
                canAddProduct ? (
                  <Plus size={15} aria-hidden="true" />
                ) : undefined
              }
              onClick={() => onAddProduct?.(product)}
            >
              {getActionLabel(product, isAddedToCurrentPharmacy)}
            </Button>
          );
        },
      },
    ],
    [
      addingProductId,
      categoryDirectory,
      currentPharmacyId,
      isAddActionDisabled,
      onAddProduct,
    ]
  );

  return (
    <DataTable
      columns={columns}
      items={products}
      getItemKey={(product) => String(product.id)}
      isLoading={isLoading}
      minWidth={0}
      labels={{
        loading: 'Loading products...',
        empty: emptyMessage,
      }}
    />
  );
}

export default AllProductsTable;
export { AllProductsTable };
export type { AllProductsTableProps };
