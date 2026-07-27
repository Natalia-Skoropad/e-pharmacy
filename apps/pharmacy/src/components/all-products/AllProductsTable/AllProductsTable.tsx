import { useMemo } from 'react';

import { Button, TextActionButton } from '@e-pharmacy/ui/primitives';

import {
  DataTable,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { PRODUCT_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/presentation';
import type { EntityId } from '@e-pharmacy/types/primitives';
import type { ProductDetails } from '@e-pharmacy/types/products';
import { getPharmacyAllProductPath } from '@/lib/routes';

import { getProductImageSrc } from '@/lib/products/product-images';

import { StatusBadge } from '@e-pharmacy/ui/statistics';

//===================================================================

type AllProductsTableProps = Readonly<{
  currentPharmacyId: EntityId | null;
  products: ProductDetails[];
  emptyMessage: string;
  isLoading?: boolean;
  isAddActionDisabled?: boolean;
  addingProductId?: EntityId | null;
  onAddProduct?: (product: ProductDetails) => void;
}>;

//===================================================================

function isProductAddedToCurrentPharmacy(
  product: ProductDetails,
  currentPharmacyId: EntityId | null
): boolean {
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
        title: <TableHeaderTitle parts={['ProductDetails', 'photo']} />,
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
        title: <TableHeaderTitle parts={['ProductDetails', 'article']} />,
        render: (product) => (
          <TextActionButton href={getPharmacyAllProductPath(product.id)}>
            {product.article}
          </TextActionButton>
        ),
      },
      {
        key: 'name',
        title: <TableHeaderTitle parts={['ProductDetails', 'name']} />,
        render: (product) => (
          <TextActionButton href={getPharmacyAllProductPath(product.id)}>
            {product.name}
          </TextActionButton>
        ),
      },
      {
        key: 'category',
        title: <TableHeaderTitle parts={['ProductDetails', 'category']} />,
        render: (product) => PRODUCT_CATEGORY_LABELS[product.category],
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['ProductDetails', 'status']} />,
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
