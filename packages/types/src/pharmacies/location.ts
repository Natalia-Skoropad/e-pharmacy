/** GeoJSON Point used by the pharmacy location contract. */
export type PharmacyGeoPoint = Readonly<{
  type: 'Point';
  coordinates: readonly [longitude: number, latitude: number];
}>;

//=============================================================================

/**
 * Canonical complete pharmacy location.
 *
 * A location must satisfy this shape before a pharmacy can be sent for
 * verification. Region and coordinates intentionally remain optional.
 */
export type PharmacyLocation = Readonly<{
  address: string;
  settlement: string;
  region?: string;
  countryCode: string;
  geo?: PharmacyGeoPoint;
}>;

//=============================================================================

/**
 * Draft persistence shape for a new pharmacy.
 *
 * Stage 13.4.2 intentionally allows an incomplete location while the pharmacy
 * remains in the `new` lifecycle state. Later verification requires the
 * complete `PharmacyLocation` contract.
 */
export type PharmacyLocationDraft = Readonly<Partial<PharmacyLocation>>;
