'use client';

// User avatars can come from profile storage/CDN URLs that are not always known
// at build time, so this isolated component keeps the native image exception in
// one documented place instead of spreading eslint disables across layouts.

//===================================================================

type AvatarImageProps = {
  src: string;
  alt?: string;
  className?: string;
};

//===================================================================

function AvatarImage({ src, alt = '', className }: AvatarImageProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={src} alt={alt} />;
}

export default AvatarImage;
