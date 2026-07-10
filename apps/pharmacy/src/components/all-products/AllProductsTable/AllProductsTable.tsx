import { useMemo } from 'react';

import {
  Button,
  DataTable,
  TableHeaderTitle,
  TableImagePreview,
  TextActionButton,
  type DataTableColumn,
} from '@e-pharmacy/ui/common';

import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/types/products';
import type { EntityId, Product } from '@e-pharmacy/types';
import { formatShortDate } from '@e-pharmacy/utils/formatters';

import { PRODUCT_STATUS_LABELS } from '@/lib/products/products';
import { getPharmacyAllProductPath } from '@/lib/layout/routes';
import { getProductImageSrc } from '@/lib/products/product-images';

//===================================================================

type AllProductsTableProps = Readonly<{
  currentPharmacyId: EntityId | null;
  products: Product[];
  emptyMessage: string;
  isLoading?: boolean;
  isAddActionDisabled?: boolean;
  addingProductId?: EntityId | null;
  onAddProduct?: (product: Product) => void;
}>;

//===================================================================

function isProductAddedToCurrentPharmacy(
  product: Product,
  currentPharmacyId: EntityId | null
): boolean {
  if (!currentPharmacyId) return false;

  return product.offers.some(
    (offer) => String(offer.pharmacyId) === String(currentPharmacyId)
  );
}

//===================================================================

function getStatusLabel(product: Product): string {
  return product.status === 'new'
    ? 'New'
    : PRODUCT_STATUS_LABELS[product.status];
}

//===================================================================

function getActionLabel(product: Product, isAddedToCurrentPharmacy: boolean) {
  if (product.status === 'blocked') return 'Unavailable';
  if (isAddedToCurrentPharmacy) return 'Added to your pharmacy';

  return 'Add to pharmacy';
}

//===================================================================

function AllProductsTable({
  currentPharmacyId,
  products,
  emptyMessage,
  isLoading = false,
  isAddActionDisabled = false,
  addingProductId = null,
  onAddProduct,
}: AllProductsTableProps) {
  const columns = useMemo<Array<DataTableColumn<Product>>>(
    () => [
      {
        key: 'createdAt',
        title: <TableHeaderTitle parts={['Created', 'date']} />,
        render: (product) =>
          product.createdAt ? (
            <time dateTime={product.createdAt}>
              {formatShortDate(product.createdAt)}
            </time>
          ) : (
            '—'
          ),
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
        render: (product) => PRODUCT_CATEGORY_LABELS[product.category],
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Product', 'status']} />,
        render: (product) => (
          <StatusBadge
            status={product.status}
            label={getStatusLabel(product)}
          />
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
              disabled={!canAddProduct}
              isLoading={addingProductId === product.id}
              loadingLabel="Adding..."
              onClick={() => onAddProduct?.(product)}
            >
              {getActionLabel(product, isAddedToCurrentPharmacy)}
            </Button>
          );
        },
      },
    ],
    [addingProductId, currentPharmacyId, isAddActionDisabled, onAddProduct]
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
