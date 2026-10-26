import type {
  PharmacyLocationDraft,
  PharmacyPendingModeration,
} from '../../types/pharmacies/pharmacy';

//===============================================================

// Copy explicit location fields only; do not leak persistence metadata or
// share mutable geo coordinate arrays between published and pending values.
export function clonePharmacyLocation(
  location?: PharmacyLocationDraft
): PharmacyLocationDraft | undefined {
  if (!location) return undefined;

  return {
    ...(location.address !== undefined ? { address: location.address } : {}),

    ...(location.settlement !== undefined
      ? { settlement: location.settlement }
      : {}),

    ...(location.region !== undefined ? { region: location.region } : {}),

    ...(location.countryCode !== undefined
      ? { countryCode: location.countryCode }
      : {}),

    ...(location.geo !== undefined
      ? {
          geo: {
            type: 'Point',
            coordinates: [
              location.geo.coordinates[0],
              location.geo.coordinates[1],
            ],
          },
        }
      : {}),
  };
}

//===============================================================

export function clonePendingModerationFields(
  current: PharmacyPendingModeration | undefined
): PharmacyPendingModeration {
  if (!current) return {};

  return {
    ...(current.name !== undefined ? { name: current.name } : {}),

    ...(current.location !== undefined
      ? { location: clonePharmacyLocation(current.location) }
      : {}),

    ...(current.phone !== undefined ? { phone: current.phone } : {}),
    ...(current.email !== undefined ? { email: current.email } : {}),

    ...(current.workingHours !== undefined
      ? { workingHours: current.workingHours }
      : {}),

    ...(current.imageUrl !== undefined ? { imageUrl: current.imageUrl } : {}),

    ...(current.description !== undefined
      ? { description: current.description }
      : {}),

    ...(current.shortDescription !== undefined
      ? { shortDescription: current.shortDescription }
      : {}),

    ...(current.documents !== undefined
      ? { documents: [...current.documents] }
      : {}),

    ...(current.bankDetails !== undefined
      ? { bankDetails: { ...current.bankDetails } }
      : {}),
  };
}
