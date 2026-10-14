import type {
  PharmacyLocationFilterOption,
  PharmacyOption,
} from '@e-pharmacy/types/pharmacies';

import { normalizeLocationKey } from './pharmacies-catalog-filters';

//===================================================================

export function matchesPharmacyLocation(
  location: PharmacyOption['location'],
  settlement: string,
  region: string
): boolean {
  return (
    Boolean(location?.settlement) &&
    normalizeLocationKey(location?.settlement ?? '') ===
      normalizeLocationKey(settlement) &&
    normalizeLocationKey(location?.region ?? '') ===
      normalizeLocationKey(region)
  );
}

//===================================================================

export function filterPharmacyOptionsByLocation(
  options: readonly PharmacyOption[],
  settlement: string,
  region: string,
  selectedPharmacyId?: string
): readonly PharmacyOption[] {
  if (!settlement) return options;

  return options.filter(
    (pharmacy) =>
      pharmacy.id === selectedPharmacyId ||
      matchesPharmacyLocation(pharmacy.location, settlement, region)
  );
}

//===================================================================

export function filterLocationOptionsByPharmacy(
  options: readonly PharmacyLocationFilterOption[],
  selectedPharmacy: PharmacyOption | undefined,
  selectedSettlement: string,
  selectedRegion: string
): readonly PharmacyLocationFilterOption[] {
  if (!selectedPharmacy?.location?.settlement) return options;

  return options.filter(
    (location) =>
      // Keep a selected location accessible for conflicting direct URLs.
      (normalizeLocationKey(location.settlement) ===
        normalizeLocationKey(selectedSettlement) &&
        normalizeLocationKey(location.region ?? '') ===
          normalizeLocationKey(selectedRegion)) ||
      matchesPharmacyLocation(
        selectedPharmacy.location,
        location.settlement,
        location.region ?? ''
      )
  );
}
