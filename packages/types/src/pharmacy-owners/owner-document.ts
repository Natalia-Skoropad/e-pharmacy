import type { EntityId, FileMetadata, ISODateTimeString } from '../primitives';

//===================================================================

export type PharmacyOwnerDocument = FileMetadata &
  Readonly<{
    id: EntityId;
    uploadedAt: ISODateTimeString;
    updatedAt: ISODateTimeString;
  }>;

export type PharmacyOwnerDocumentUploadPayload = FileMetadata &
  Readonly<{
    dataUrl: string;
  }>;

export type PharmacyOwnerDocumentsResponse = Readonly<{
  documents: readonly PharmacyOwnerDocument[];
}>;

export type PharmacyOwnerDocumentResponse = Readonly<{
  document: PharmacyOwnerDocument;
}>;
