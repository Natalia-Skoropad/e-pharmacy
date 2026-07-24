import type { EntityId } from './entity-id';

//===================================================================

export type FileMetadata = Readonly<{
  name: string;
  size: number;
  type: string;
}>;

export type SerializedUploadFile = FileMetadata &
  Readonly<{
    dataUrl: string;
  }>;

export type StoredFileReference = FileMetadata &
  Readonly<{
    id: EntityId;
    url: string;
  }>;
