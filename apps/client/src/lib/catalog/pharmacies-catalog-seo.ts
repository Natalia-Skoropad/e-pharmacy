import {
  formatPharmacyCityLabel,
  isPharmacyNoIndex,
  type PharmacyFilters,
} from './pharmacies-catalog-filters';

//===================================================================

export type PharmaciesCatalogSeoContent = Readonly<{
  intro: string;
  comparison: string;
  ordering: string;
}>;

//===================================================================

export function getPharmacyTitle(filters: PharmacyFilters): string {
  if (filters.city) {
    return `Choose a pharmacy in ${formatPharmacyCityLabel(filters.city)}`;
  }

  return 'Pharmacies';
}

//===================================================================

export function getPharmacyDescription(filters: PharmacyFilters): string {
  if (filters.city) {
    return `Find active E-PHARMACY pharmacies in ${formatPharmacyCityLabel(filters.city)}, compare ratings, addresses, contact details, and available products before preparing an order.`;
  }

  return 'Find active E-PHARMACY pharmacies, compare ratings, addresses, contact details, and available products before preparing an order.';
}

//===================================================================

export function getPharmaciesSeoContent(
  filters: PharmacyFilters
): PharmaciesCatalogSeoContent {
  const cityText = filters.city
    ? `pharmacies in ${formatPharmacyCityLabel(filters.city)}`
    : 'active pharmacies';

  return {
    intro: `Browse ${cityText} participating in E-PHARMACY.`,

    comparison:
      'Compare ratings, addresses, contact details, and the number of currently available products before opening a pharmacy page.',

    ordering:
      'Choose a pharmacy to view its catalog and prepare an order. Availability, pickup, delivery, and final sale conditions are confirmed by the selected pharmacy.',
  };
}

//===================================================================

export function shouldShowPharmaciesSeoText(filters: PharmacyFilters): boolean {
  return !isPharmacyNoIndex(filters);
}
