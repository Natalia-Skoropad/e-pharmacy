import {
  Building2,
  FileText,
  FlaskConical,
  Package2,
  Tags,
} from 'lucide-react';

import { MarkdownContent } from '@e-pharmacy/ui/data-display';
import { CategoryIcon } from '@e-pharmacy/ui/forms';
import type { ProductDetails } from '@e-pharmacy/types/products';

import aboutCss from '@/components/pharmacies/PharmacyDetailsPageContent/PharmacyAboutPanel.module.css';

import css from './ProductCharacteristicsPanel.module.css';

//===================================================================

export type ProductCharacteristicsPanelProps = Readonly<{
  product: ProductDetails;
  isPageHeading?: boolean;
}>;

//===================================================================

export function ProductCharacteristicsPanel({
  product,
  isPageHeading = false,
}: ProductCharacteristicsPanelProps) {
  const description = product.description?.trim();

  return (
    <>
      <header className={aboutCss.header}>
        <span className={aboutCss.headerIcon} aria-hidden="true">
          <FileText size={22} />
        </span>
        <div>
          {isPageHeading ? (
            <h1 className={aboutCss.title}>Characteristics</h1>
          ) : (
            <h2 className={aboutCss.title}>Characteristics</h2>
          )}
          <p className={aboutCss.subtitle}>
            Manufacturer, dosage, packaging and description of this product.
          </p>
        </div>
      </header>

      <div className={aboutCss.description}>
        <dl className={css.details}>
          {product.manufacturer ? (
            <div className={css.item}>
              <dt>
                <span className={css.termIcon} aria-hidden="true">
                  <Building2 size={16} />
                </span>
                Manufacturer
              </dt>
              <dd>{product.manufacturer}</dd>
            </div>
          ) : null}
          {product.dosage ? (
            <div className={css.item}>
              <dt>
                <span className={css.termIcon} aria-hidden="true">
                  <FlaskConical size={16} />
                </span>
                Dosage
              </dt>
              <dd>{product.dosage}</dd>
            </div>
          ) : null}
          {product.packageQuantity ? (
            <div className={css.item}>
              <dt>
                <span className={css.termIcon} aria-hidden="true">
                  <Package2 size={16} />
                </span>
                Package
              </dt>
              <dd>{product.packageQuantity}</dd>
            </div>
          ) : null}
          <div className={css.item}>
            <dt>
              <span className={css.termIcon} aria-hidden="true">
                <Tags size={16} />
              </span>
              Category
            </dt>
            <dd>
              <span className={css.categoryValue}>
                <span className={css.categoryIcon} aria-hidden="true">
                  <CategoryIcon name={product.category.icon} size={16} />
                </span>
                {product.category.name}
              </span>
            </dd>
          </div>
        </dl>
        <MarkdownContent
          value={(
            description || 'Detailed description is not available yet.'
          ).replace(/^#(?=\s+\S)/gm, '##')}
        />
      </div>
    </>
  );
}
