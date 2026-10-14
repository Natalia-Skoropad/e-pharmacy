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

export function getPharmacyTitle(
  filters: PharmacyFilters,
  pharmacyName?: string
): string {
  const locationLabel = getSelectedLocationLabel(filters);

  if (filters.pharmacyId) {
    const name = pharmacyName?.trim() || 'Selected pharmacy';
    return locationLabel ? `${name} in ${locationLabel}` : name;
  }

  return locationLabel ? `Choose a pharmacy in ${locationLabel}` : 'Pharmacies';
}

//===================================================================

export function getPharmacyDescription(
  filters: PharmacyFilters,
  pharmacyName?: string
): string {
  const locationLabel = getSelectedLocationLabel(filters);

  if (filters.pharmacyId) {
    const name = pharmacyName?.trim() || 'the selected pharmacy';
    const location = locationLabel ? ` in ${locationLabel}` : '';

    return (
      `Find ${name}${location} on E-PHARMACY. Compare its rating, address, ` +
      'contact details, and available products before preparing an order.'
    );
  }

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
  filters: PharmacyFilters,
  pharmacyName?: string
): PharmaciesCatalogSeoContent {
  const locationLabel = getSelectedLocationLabel(filters);

  const selectedName = filters.pharmacyId
    ? pharmacyName?.trim() || 'the selected pharmacy'
    : '';

  if (filters.pharmacyId) {
    return {
      intro: `Explore ${selectedName}${locationLabel ? ` in ${locationLabel}` : ''} on E-PHARMACY.`,

      comparison:
        'Check this pharmacy’s rating, address, contact details, and available ' +
        'products before opening its page.',

      ordering:
        'Open the pharmacy page to explore its catalog and prepare an order. ' +
        'Availability, pickup, delivery, and final sale conditions are confirmed by the pharmacy.',
    };
  }

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
  return Boolean(filters.pharmacyId) || !isPharmacyNoIndex(filters);
}
