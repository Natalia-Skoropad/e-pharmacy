import type { ImgHTMLAttributes } from 'react';

import { normalizeImageSource } from '../image-source';

import {
  chooseManagedPhotoSize,
  type ManagedPhotoSize,
} from '../managed-photo-url';

//===================================================================

export type ImagePreviewProps = Readonly<{
  src: string;
  alt?: string;
  className?: string;
  mediaSize?: ManagedPhotoSize;
}> &
  Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'className'>;

//===================================================================

function ImagePreview({
  src,
  alt = '',
  className,
  mediaSize = 'medium',
  ...props
}: ImagePreviewProps) {
  return (
    <img
      className={className}
      src={String(normalizeImageSource(chooseManagedPhotoSize(src, mediaSize)))}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}

export default ImagePreview;
export { ImagePreview };
