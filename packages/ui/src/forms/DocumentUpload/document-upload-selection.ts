import type { BrowserUploadFile } from '../types';

//===================================================================

export type UploadFileSelectionResult = Readonly<{
  files: BrowserUploadFile[];
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

function createStoredFileFingerprint(file: BrowserUploadFile): string | null {
  return file.file ? createFileFingerprint(file.file) : null;
}

//===================================================================

function toBrowserUploadFile(file: File): BrowserUploadFile {
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
  currentFiles: readonly BrowserUploadFile[],
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

  const acceptedFiles: BrowserUploadFile[] = [];
  let duplicateCount = 0;

  for (const file of selectedFiles) {
    const fingerprint = createFileFingerprint(file);

    if (fingerprints.has(fingerprint)) {
      duplicateCount += 1;
      continue;
    }

    fingerprints.add(fingerprint);
    acceptedFiles.push(toBrowserUploadFile(file));

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
