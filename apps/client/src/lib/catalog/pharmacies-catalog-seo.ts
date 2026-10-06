import {
  formatPharmacyLocationLabel,
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

function getSelectedLocationLabel(filters: PharmacyFilters): string {
  return filters.settlement
    ? formatPharmacyLocationLabel(filters.settlement, filters.region)
    : '';
}

//===================================================================

export function getPharmacyTitle(filters: PharmacyFilters): string {
  const locationLabel = getSelectedLocationLabel(filters);

  return locationLabel ? `Choose a pharmacy in ${locationLabel}` : 'Pharmacies';
}

//===================================================================

export function getPharmacyDescription(filters: PharmacyFilters): string {
  const locationLabel = getSelectedLocationLabel(filters);

  if (locationLabel) {
    return (
      `Find active E-PHARMACY pharmacies in ${locationLabel}, compare ratings, ` +
      'addresses, contact details, and available products before preparing an order.'
    );
  }

  return (
    'Find active E-PHARMACY pharmacies, compare ratings, addresses, contact ' +
    'details, and available products before preparing an order.'
  );
}

//===================================================================

export function getPharmaciesSeoContent(
  filters: PharmacyFilters
): PharmaciesCatalogSeoContent {
  const locationLabel = getSelectedLocationLabel(filters);

  const locationText = locationLabel
    ? `pharmacies in ${locationLabel}`
    : 'active pharmacies';

  return {
    intro: `Browse ${locationText} participating in E-PHARMACY.`,

    comparison:
      'Compare ratings, addresses, contact details, and the number of currently ' +
      'available products before opening a pharmacy page.',

    ordering:
      'Choose a pharmacy to view its catalog and prepare an order. Availability, ' +
      'pickup, delivery, and final sale conditions are confirmed by the selected pharmacy.',
  };
}

//===================================================================

export function shouldShowPharmaciesSeoText(filters: PharmacyFilters): boolean {
  return !isPharmacyNoIndex(filters);
}
