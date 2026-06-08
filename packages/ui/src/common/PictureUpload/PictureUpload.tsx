// Uploaded pictures can come from storage/CDN URLs that are not always known
// at build time, so this isolated component keeps the native image exception in
// one documented place instead of spreading native images across layouts.

//===================================================================

type PictureUploadProps = {
  src: string;
  alt?: string;
  className?: string;
};

//===================================================================

function PictureUpload({ src, alt = '', className }: PictureUploadProps) {
  return <img className={className} src={src} alt={alt} />;
}

export default PictureUpload;
