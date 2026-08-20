import type {
  EntityId,
  FileMetadata,
  ISODateTimeString,
} from '../primitives';

//===================================================================

/** Server-generated reference to binary verification content. */
export type PharmacyVerificationDocument = FileMetadata &
  Readonly<{
    id: EntityId;
    sha256: string;
    uploadedAt: ISODateTimeString;
  }>;

//===================================================================

/** One-time registration claim returned by the controlled upload endpoint. */
export type PharmacyRegistrationDocumentClaim = Readonly<{
  documentId: EntityId;
  claimToken: string;
}>;

//===================================================================

export type PharmacyDocumentUploadPayload = FileMetadata &
  Readonly<{
    dataUrl: string;
  }>;

export type PharmacyRegistrationUploadSessionResponse = Readonly<{
  uploadSessionId: EntityId;
  uploadToken: string;
  expiresAt: ISODateTimeString;
  maxFiles: number;
  maxTotalSizeBytes: number;
}>;

export type PharmacyRegistrationDocumentUploadPayload =
  PharmacyDocumentUploadPayload &
    Readonly<{
      uploadSessionId: EntityId;
      uploadToken: string;
    }>;

export type PharmacyRegistrationDocumentUploadResponse = Readonly<{
  document: PharmacyVerificationDocument;
  claimToken: string;
}>;

export type PharmacyProfileDocumentUploadResponse = Readonly<{
  document: PharmacyVerificationDocument;
}>;

