'use client';

import type { ComponentProps } from 'react';

import { ShimmerImage } from '../ShimmerImage';
import { PHOTO_PRESETS, type PhotoPreset } from '../photo-presets';

//===================================================================

// New pages use a semantic preset instead of repeating mediaSize + sizes.
// `sizes` is an escape hatch for components with a proven custom CSS width.
// Mark only the actual above-the-fold LCP photo as `priority`.
export type ResponsivePhotoProps = Omit<
  ComponentProps<typeof ShimmerImage>,
  'mediaSize' | 'sizes'
> & {
  preset: PhotoPreset;
  sizes?: string;
};

//===================================================================

export function ResponsivePhoto({
  preset,
  sizes,
  priority,
  fetchPriority,
  ...props
}: ResponsivePhotoProps) {
  const config = PHOTO_PRESETS[preset];

  return (
    <ShimmerImage
      {...props}
      mediaSize={config.mediaSize}
      sizes={sizes ?? config.sizes}
      priority={priority}
      fetchPriority={priority ? 'high' : fetchPriority}
    />
  );
}

export default ResponsivePhoto;
