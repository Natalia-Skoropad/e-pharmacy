import { FileText } from 'lucide-react';

import {
  MarkdownContent,
  ProductCharacteristicsList,
} from '@e-pharmacy/ui/data-display';

import type { ProductDetails } from '@e-pharmacy/types/products';

import aboutCss from '@/components/pharmacies/PharmacyDetailsPageContent/PharmacyAboutPanel.module.css';

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
            Brand, series, manufacturer, release form and active ingredients.
          </p>
        </div>
      </header>

      <div className={aboutCss.description}>
        <ProductCharacteristicsList product={product} />
        <MarkdownContent
          value={(
            description || 'Detailed description is not available yet.'
          ).replace(/^#(?=\s+\S)/gm, '##')}
        />
      </div>
    </>
  );
}
