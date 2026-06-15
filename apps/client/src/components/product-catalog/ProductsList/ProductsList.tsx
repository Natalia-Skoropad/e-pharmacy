import ProductCard from '@/components/product-catalog/ProductCard';

import type { Product } from '@e-pharmacy/types';

import css from './ProductsList.module.css';

//===================================================================

type ProductsListProps = {
  products: Product[];
};

//===================================================================

function ProductsList({ products }: ProductsListProps) {
  if (products.length === 0) {
    return (
      <div className={css.empty}>
        <h2 className={css.emptyTitle}>No products found</h2>
        <p className={css.emptyText}>
          Products will appear here after they are added to the selected
          pharmacy pharmacy.
        </p>
      </div>
    );
  }

  return (
    <div className={css.list}>
      {products.map((product) => (
        <div className={css.item} key={product.id}>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}

export default ProductsList;
