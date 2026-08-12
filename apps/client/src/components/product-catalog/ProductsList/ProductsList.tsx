import type { ProductCardSummary } from '@e-pharmacy/types/products';

import CatalogGrid from '@/components/catalog/CatalogGrid/CatalogGrid';
import ProductCard from '@/components/product-catalog/ProductCard/ProductCard';

//===================================================================

export type ProductsListProps = Readonly<{
  products: readonly ProductCardSummary[];
  pharmacyId?: string;
  pharmacyName?: string;
}>;

//===================================================================

function ProductsList({
  products,
  pharmacyId,
  pharmacyName,
}: ProductsListProps) {
  return (
    <CatalogGrid ariaLabel="Products">
      {products.map((product) => (
        <CatalogGrid.Item key={product.id}>
          <ProductCard
            product={product}
            pharmacyId={pharmacyId}
            pharmacyName={pharmacyName}
          />
        </CatalogGrid.Item>
      ))}
    </CatalogGrid>
  );
}

export default ProductsList;
