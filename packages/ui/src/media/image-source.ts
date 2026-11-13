import type { ImageProps } from 'next/image';

import type { ManagedPhotoSize } from './managed-photo-url';

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

//===================================================================

/**
 * Demo catalog assets are shipped as WebP derivatives alongside their legacy
 * PNGs. Existing database URLs stay unchanged; the UI selects an appropriately
 * sized asset and falls back to the PNG if a deployment is not yet updated.
 * Client profile/document images are deliberately excluded.
 */
const SEED_CATALOG_PNG =
  /^\/images\/seed\/(?:products\/product-\d{3}|pharmacies\/pharmacy-\d{3})\.png$/;

//===================================================================

export function chooseSeedImageSize(
  source: string,
  size: ManagedPhotoSize
): string {
  return SEED_CATALOG_PNG.test(source)
    ? source.replace(/\.png$/, `-${size}.webp`)
    : source;
}
