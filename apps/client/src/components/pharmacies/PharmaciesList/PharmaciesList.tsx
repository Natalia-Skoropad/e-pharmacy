import type { PharmacyCardSummary } from '@e-pharmacy/types/pharmacies';

import CatalogGrid from '@/components/catalog/CatalogGrid/CatalogGrid';
import PharmacyCard from '@/components/pharmacies/PharmacyCard/PharmacyCard';

//===================================================================

export type PharmaciesListProps = Readonly<{
  pharmacies: readonly PharmacyCardSummary[];
}>;

//===================================================================

function PharmaciesList({ pharmacies }: PharmaciesListProps) {
  return (
    <CatalogGrid ariaLabel="Pharmacies">
      {pharmacies.map((pharmacy) => (
        <CatalogGrid.Item key={pharmacy.id}>
          <PharmacyCard pharmacy={pharmacy} />
        </CatalogGrid.Item>
      ))}
    </CatalogGrid>
  );
}

export default PharmaciesList;
