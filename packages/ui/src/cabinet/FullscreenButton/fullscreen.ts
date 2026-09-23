export type FullscreenDocumentLike = Readonly<{
  fullscreenEnabled?: boolean;
  fullscreenElement: unknown;
  documentElement: Readonly<{
    requestFullscreen?: () => Promise<void>;
  }>;
  exitFullscreen?: () => Promise<void>;
}>;

//===================================================================

export function isFullscreenAvailable(
  documentLike: FullscreenDocumentLike
): boolean {
  return (
    documentLike.fullscreenEnabled !== false &&
    typeof documentLike.documentElement.requestFullscreen === 'function' &&
    typeof documentLike.exitFullscreen === 'function'
  );
}

//===================================================================

export async function toggleFullscreen(
  documentLike: FullscreenDocumentLike
): Promise<'entered' | 'exited' | 'unsupported' | 'rejected'> {
  if (!isFullscreenAvailable(documentLike)) return 'unsupported';

  try {
    if (documentLike.fullscreenElement) {
      await documentLike.exitFullscreen?.();
      return 'exited';
    }

    await documentLike.documentElement.requestFullscreen?.();
    return 'entered';
  } catch {
    return 'rejected';
  }
}
