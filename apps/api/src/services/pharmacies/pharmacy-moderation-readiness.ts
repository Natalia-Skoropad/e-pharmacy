import type {
  PharmacyEntity,
  PharmacyPendingModeration,
} from '../../types/pharmacies/pharmacy';

//===============================================================

// Mongoose nested paths are not plain objects. Spreading the hydrated
// `location` or `bankDetails` subdocument can omit their actual fields.
// Read each published field explicitly and apply the pending value only
// when it is present, preserving explicit null/empty clears for validation.
const proposedOrPublished = (proposed: unknown, published: unknown): unknown =>
  proposed === undefined ? published : proposed;

//===============================================================

export function missingRequiredModerationFields(
  pharmacy: PharmacyEntity,
  pending: PharmacyPendingModeration
): string[] {
  // Location patches are normalized against the published location before
  // submission. When a pending location exists, it is the full replacement;
  // a removed required address must not silently fall back to the old one.
  const location =
    pending.location !== undefined ? pending.location : pharmacy.location;

  const bank = pharmacy.bankDetails;
  const pendingBank = pending.bankDetails;

  const required: Record<string, unknown> = {
    name: proposedOrPublished(pending.name, pharmacy.name),
    phone: proposedOrPublished(pending.phone, pharmacy.phone),
    email: proposedOrPublished(pending.email, pharmacy.email),

    workingHours: proposedOrPublished(
      pending.workingHours,
      pharmacy.workingHours
    ),

    imageUrl: proposedOrPublished(pending.imageUrl, pharmacy.imageUrl),
    description: proposedOrPublished(pending.description, pharmacy.description),

    shortDescription: proposedOrPublished(
      pending.shortDescription,
      pharmacy.shortDescription
    ),

    address: location?.address,
    settlement: location?.settlement,
    region: location?.region,
    countryCode: location?.countryCode,

    recipientName: proposedOrPublished(
      pendingBank?.recipientName,
      bank?.recipientName
    ),

    taxId: proposedOrPublished(pendingBank?.taxId, bank?.taxId),
    iban: proposedOrPublished(pendingBank?.iban, bank?.iban),
    bankName: proposedOrPublished(pendingBank?.bankName, bank?.bankName),

    receiptEmail: proposedOrPublished(
      pendingBank?.receiptEmail,
      bank?.receiptEmail
    ),

    paymentPurpose: proposedOrPublished(
      pendingBank?.paymentPurpose,
      bank?.paymentPurpose
    ),

    documents:
      pending.documents !== undefined
        ? pending.documents.length
        : pharmacy.documents?.length,
  };

  return Object.entries(required)
    .filter(([, value]) => !value)
    .map(([field]) => field);
}
