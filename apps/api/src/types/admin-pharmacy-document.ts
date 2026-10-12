import type { PharmacyProfileVerificationDocumentResponseDto } from './pharmacy';

//===============================================================

export type AdminPharmacyDocumentDto =
  PharmacyProfileVerificationDocumentResponseDto & {
    source: 'published' | 'pending';
  };
