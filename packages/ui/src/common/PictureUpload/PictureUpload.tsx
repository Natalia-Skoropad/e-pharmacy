import type { ImgHTMLAttributes } from 'react';

// Uploaded pictures can come from storage/CDN URLs that are not always known
// at build time, so this isolated component keeps the native image exception in
// one documented place instead of spreading native images across layouts.

//===================================================================

export type PictureUploadProps = {
  src: string;
  alt?: string;
  className?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'className'>;

//===================================================================

function PictureUpload({
  src,
  alt = '',
  className,
  ...props
}: PictureUploadProps) {
  return <img className={className} src={src} alt={alt} {...props} />;
}

export default PictureUpload;

export { PictureUpload };
