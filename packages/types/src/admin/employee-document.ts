import type { EntityId, FileMetadata, ISODateTimeString } from '../primitives';

//===================================================================

export type AdminEmployeeDocument = FileMetadata &
  Readonly<{
    id: EntityId;
    uploadedAt: ISODateTimeString;
    updatedAt: ISODateTimeString;
  }>;

export type AdminEmployeeDocumentUploadPayload = FileMetadata &
  Readonly<{
    dataUrl: string;
  }>;

export type AdminEmployeeDocumentsResponse = Readonly<{
  documents: readonly AdminEmployeeDocument[];
}>;

export type AdminEmployeeDocumentResponse = Readonly<{
  document: AdminEmployeeDocument;
}>;
