import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/presentation';
import type { ProductDetails } from '@e-pharmacy/types/products';

import css from './ProductCharacteristicsPanel.module.css';

//===================================================================

export type ProductCharacteristicsPanelProps = Readonly<{
  product: ProductDetails;
}>;

//===================================================================

export function ProductCharacteristicsPanel({
  product,
}: ProductCharacteristicsPanelProps) {
  const description = product.description?.trim();

  return (
    <div className={css.panel}>
      <h2 className={css.title}>Characteristics</h2>

      <dl className={css.details}>
        {product.manufacturer ? (
          <div className={css.item}>
            <dt>Manufacturer</dt>
            <dd>{product.manufacturer}</dd>
          </div>
        ) : null}

        {product.dosage ? (
          <div className={css.item}>
            <dt>Dosage</dt>
            <dd>{product.dosage}</dd>
          </div>
        ) : null}

        {product.packageQuantity ? (
          <div className={css.item}>
            <dt>Package</dt>
            <dd>{product.packageQuantity}</dd>
          </div>
        ) : null}

        <div className={css.item}>
          <dt>Category</dt>
          <dd>{PRODUCT_CATEGORY_LABELS[product.category]}</dd>
        </div>
      </dl>

      <div className={css.description}>
        <p>
          {description ?? 'Detailed description is not available yet.'}
        </p>
      </div>
    </div>
  );
}
