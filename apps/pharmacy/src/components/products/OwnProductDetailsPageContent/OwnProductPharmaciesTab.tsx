import type { ProductDetails, ProductOffer } from '@e-pharmacy/types/products';
import { DataTable } from '@e-pharmacy/ui/data-display';
import { TextActionButton } from '@e-pharmacy/ui/primitives';
import { formatMoney } from '@e-pharmacy/utils/money';

import { getOwnedPharmacyPath } from '@/lib/routes';

import css from './OwnProductDetailsPageContent.module.css';

//===================================================================

export function OwnProductPharmaciesTab({
  product,
}: Readonly<{ product: ProductDetails }>) {
  return (
    <section
      className={css.sectionCard}
      aria-label="Pharmacies carrying this product"
    >
      <DataTable
        columns={[
          {
            key: 'name',
            title: 'Pharmacy',

            render: (offer: ProductOffer) => (
              <TextActionButton href={getOwnedPharmacyPath(offer.pharmacyId)}>
                {offer.pharmacyName}
              </TextActionButton>
            ),
          },
          {
            key: 'id',
            title: 'Pharmacy ID',
            render: (offer: ProductOffer) => offer.pharmacyId,
          },
          {
            key: 'price',
            title: 'Current price, ₴',
            render: (offer: ProductOffer) => formatMoney(offer.price) ?? '—',
          },
          {
            key: 'available',
            title: 'Available quantity',
            render: (offer: ProductOffer) => offer.availableQuantity,
          },
        ]}
        items={product.offers}
        getItemKey={(offer) => offer.id}
        labels={{ empty: 'No pharmacy offers are available for this product.' }}
      />
    </section>
  );
}
