import type { PharmacyProfileVerificationDocumentResponseDto } from '../../pharmacies/pharmacy';

//===============================================================

export type AdminPharmacyDocumentDto =
  PharmacyProfileVerificationDocumentResponseDto & {
    source: 'published' | 'pending';
  };
