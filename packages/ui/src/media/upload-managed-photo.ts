import { readFileAsDataUrl } from './read-file-as-data-url';

//===================================================================

const PHOTO_URL = /^\/api\/media\/[a-f0-9]{24}\/large$/;

//===================================================================

/** The host application supplies its authenticated, CSRF-protected BFF transport.
 * Shared UI does not issue network requests or depend on application routes. */
export type StoreManagedPhotoTransport = (
  dataUrl: string,
  signal?: AbortSignal
) => Promise<unknown>;

//===================================================================

/** Upload the ORIGINAL photo so the backend can preserve its full-resolution
 * master. The API generates separate immutable WebP derivatives. */
export async function uploadManagedPhotoDetails(
  original: File,
  signal: AbortSignal | undefined,
  transport: StoreManagedPhotoTransport
): Promise<Readonly<{ url: string; size: number; type: 'image/webp' }>> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(original.type)) {
    throw new Error('Upload a JPEG, PNG or WebP photo.');
  }

  if (!original.size || original.size > 10 * 1024 * 1024) {
    throw new Error('The original photo must be at most 10 MB.');
  }

  const dataUrl = await readFileAsDataUrl(original, signal);
  const payload = await transport(dataUrl, signal);

  const data = payload as {
    url?: unknown;
    size?: unknown;
    type?: unknown;
  } | null;

  if (
    !data ||
    typeof data.url !== 'string' ||
    !PHOTO_URL.test(data.url) ||
    typeof data.size !== 'number' ||
    !Number.isInteger(data.size) ||
    data.size <= 0 ||
    data.type !== 'image/webp'
  ) {
    throw new Error('Image storage returned an invalid response.');
  }

  return { url: data.url, size: data.size, type: 'image/webp' };
}

//===================================================================

export async function uploadManagedPhoto(
  original: File,
  signal: AbortSignal | undefined,
  transport: StoreManagedPhotoTransport
): Promise<string> {
  const result = await uploadManagedPhotoDetails(original, signal, transport);

  return result.url;
}
