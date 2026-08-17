import type { ImgHTMLAttributes } from 'react';

import { normalizeImageSource } from '../image-source';

//===================================================================

export type ImagePreviewProps = Readonly<{
  src: string;
  alt?: string;
  className?: string;
}> &
  Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'className'>;

//===================================================================

function ImagePreview({
  src,
  alt = '',
  className,
  ...props
}: ImagePreviewProps) {
  return (
    <img
      className={className}
      src={String(normalizeImageSource(src))}
      alt={alt}
      {...props}
    />
  );
}

export default ImagePreview;
export { ImagePreview };
