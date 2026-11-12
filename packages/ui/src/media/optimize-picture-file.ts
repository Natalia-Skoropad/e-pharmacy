/**
 * Best-effort client-side image optimization before storing a data URL.
 * Keep the original if the browser cannot encode WebP or compression is not
 * beneficial. The original's file type/size is validated by callers.
 */
export async function optimizePictureFile(
  file: File,
  signal?: AbortSignal,
  options: Readonly<{ targetBytes?: number; maxDimension?: number }> = {}
): Promise<File> {
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size <= (options.targetBytes ?? 60 * 1024) ||
    typeof createImageBitmap !== 'function'
  ) {
    return file;
  }

  const checkAbort = () => {
    if (signal?.aborted) {
      throw new DOMException('Image optimization was aborted.', 'AbortError');
    }
  };

  checkAbort();

  let picture: ImageBitmap;

  try {
    picture = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const targetBytes = options.targetBytes ?? 60 * 1024;
    const maxDimension = options.maxDimension ?? 1280;

    let best: Blob | null = null;

    for (const dimension of [maxDimension, 1024, 800]) {
      checkAbort();

      const scale = Math.min(
        1,
        dimension / Math.max(picture.width, picture.height)
      );

      const width = Math.max(1, Math.round(picture.width * scale));
      const height = Math.max(1, Math.round(picture.height * scale));
      const canvas = document.createElement('canvas');

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');

      if (!context) return file;

      context.drawImage(picture, 0, 0, width, height);

      for (const quality of [0.86, 0.8, 0.74]) {
        checkAbort();

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/webp', quality)
        );

        if (!blob || blob.type !== 'image/webp') return file;

        if (blob.size < file.size && (!best || blob.size < best.size)) {
          best = blob;
        }

        if (blob.size <= targetBytes) {
          return new File([blob], file.name.replace(/\.[^.]*$/, '') + '.webp', {
            type: 'image/webp',
            lastModified: file.lastModified,
          });
        }
      }
    }

    checkAbort();

    return best
      ? new File([best], file.name.replace(/\.[^.]*$/, '') + '.webp', {
          type: 'image/webp',
          lastModified: file.lastModified,
        })
      : file;
  } finally {
    picture.close();
  }
}
