import type { ImageProps } from 'next/image';

//===================================================================

const SEED_IMAGE_PATH_PREFIX = '/images/seed/';

//===================================================================

export function normalizeImageSource(
  source: ImageProps['src']
): ImageProps['src'] {
  if (typeof source !== 'string' || !source) return source;
  if (source.startsWith(SEED_IMAGE_PATH_PREFIX)) return source;

  try {
    const url = new URL(source);

    if (url.pathname.startsWith(SEED_IMAGE_PATH_PREFIX)) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // Non-absolute sources are handled by Next/Image as-is.
  }

  return source;
}
