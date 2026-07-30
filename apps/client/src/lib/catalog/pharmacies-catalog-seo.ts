import {
  isPharmacyNoIndex,
  type PharmacyFilters,
} from './pharmacies-catalog-filters';

//===================================================================

export function getPharmacyTitle(filters: PharmacyFilters): string {
  if (filters.city) return `Choose a pharmacy in ${filters.city}`;

  return 'Pharmacies';
}

//===================================================================

export function getPharmacyDescription(filters: PharmacyFilters): string {
  if (filters.city) {
    return `Find active E-PHARMACY pharmacies in ${filters.city}, compare ratings, addresses, phone numbers, and available products before choosing a pharmacy.`;
  }

  return 'Find active E-PHARMACY pharmacies, compare ratings, addresses, phone numbers, and available products before choosing a pharmacy.';
}

//===================================================================

export function getPharmaciesSeoTextParts(filters: PharmacyFilters): string[] {
  const cityText = filters.city
    ? `pharmacies in ${filters.city}`
    : 'active pharmacies';

  return [
    'Choose trusted',
    cityText,
    'without bouncing between random tabs. In the E-PHARMACY pharmacy catalog, you can compare pharmacy ratings, addresses, contact details, and the number of products available before opening a pharmacy page. Use search by name or address, select a city, sort the list, and then move straight to the products from the pharmacy that looks right. Simple, tidy, and much less dramatic than hunting for a pharmacy at 22:59.',
  ];
}

//===================================================================

export function shouldShowPharmaciesSeoText(filters: PharmacyFilters): boolean {
  return !isPharmacyNoIndex(filters);
}
