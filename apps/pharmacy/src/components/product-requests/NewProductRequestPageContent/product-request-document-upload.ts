import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';

//===================================================================

/** Publish only stored files and existing attachments in the original selection order. */
export async function uploadProductRequestDocuments(
  files: readonly BrowserUploadFile[],
  signal: AbortSignal,
  store: (file: BrowserUploadFile) => Promise<BrowserUploadFile>,
  onProgress: (files: BrowserUploadFile[]) => void
): Promise<BrowserUploadFile[] | null> {
  if (signal.aborted) return null;

  const completed = new Map(
    files
      .filter((file) => file.documentId || !file.file)
      .map((file) => [file.id, file] as const)
  );

  const snapshot = () =>
    files.flatMap((file) => {
      const stored = completed.get(file.id);
      return stored ? [stored] : [];
    });

  // Keep already saved documents visible, including after a later failure.
  onProgress(snapshot());

  for (const file of files) {
    if (signal.aborted) return null;
    if (file.documentId || (!file.file && !file.dataUrl)) continue;

    const stored = await store(file);

    if (signal.aborted) return null;

    completed.set(file.id, stored);
    onProgress(snapshot());
  }

  return snapshot();
}
