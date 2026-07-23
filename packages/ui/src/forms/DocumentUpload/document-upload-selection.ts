import type { UploadFileValue } from '@e-pharmacy/types/files';

//===================================================================

export type UploadFileSelectionResult = Readonly<{
  files: UploadFileValue[];
  duplicateCount: number;
}>;

//===================================================================

let uploadFileSequence = 0;

//===================================================================

function createUploadFileId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  uploadFileSequence += 1;
  return `upload-${Date.now()}-${uploadFileSequence}`;
}

//===================================================================

function createFileFingerprint(file: File): string {
  return [file.name, file.size, file.lastModified].join('\u0000');
}

//===================================================================

function createStoredFileFingerprint(file: UploadFileValue): string | null {
  return file.file ? createFileFingerprint(file.file) : null;
}

//===================================================================

function toUploadFileValue(file: File): UploadFileValue {
  return {
    id: createUploadFileId(),
    name: file.name,
    size: file.size,
    type: file.type,
    file,
  };
}

//===================================================================

export function mergeUploadFileSelection(
  currentFiles: readonly UploadFileValue[],
  selectedFiles: readonly File[],
  multiple: boolean
): UploadFileSelectionResult {
  if (selectedFiles.length === 0) {
    return {
      files: [...currentFiles],
      duplicateCount: 0,
    };
  }

  const fingerprints = new Set(
    currentFiles
      .map(createStoredFileFingerprint)
      .filter((fingerprint): fingerprint is string => fingerprint !== null)
  );

  const acceptedFiles: UploadFileValue[] = [];
  let duplicateCount = 0;

  for (const file of selectedFiles) {
    const fingerprint = createFileFingerprint(file);

    if (fingerprints.has(fingerprint)) {
      duplicateCount += 1;
      continue;
    }

    fingerprints.add(fingerprint);
    acceptedFiles.push(toUploadFileValue(file));

    if (!multiple) break;
  }

  if (!multiple) {
    return {
      files: acceptedFiles.length > 0 ? [acceptedFiles[0]] : [...currentFiles],
      duplicateCount,
    };
  }

  return {
    files: [...currentFiles, ...acceptedFiles],
    duplicateCount,
  };
}
