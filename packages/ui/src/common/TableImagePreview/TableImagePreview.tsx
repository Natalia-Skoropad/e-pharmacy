import type { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';

import { ShimmerImage } from '../ShimmerImage';
import css from './TableImagePreview.module.css';

//===================================================================

type TableImagePreviewProps = Readonly<{
  src?: string;
  alt: string;
  fallback?: ReactNode;
  className?: string;
  size?: number;
}>;

//===================================================================

type TableImagePreviewStyle = CSSProperties & {
  '--table-image-preview-size'?: string;
};

//===================================================================

function TableImagePreview({
  src,
  alt,
  fallback,
  className,
  size = 42,
}: TableImagePreviewProps) {
  const style: TableImagePreviewStyle = {
    '--table-image-preview-size': `${size}px`,
  };

  return (
    <span className={clsx(css.preview, className)} style={style}>
      {src ? (
        <ShimmerImage
          src={src}
          alt={alt}
          sizes={`${size}px`}
          as="span"
          unoptimized
        />
      ) : (
        <span className={css.fallback} aria-hidden="true">
          {fallback ?? '—'}
        </span>
      )}
    </span>
  );
}

export default TableImagePreview;
export { TableImagePreview };
export type { TableImagePreviewProps };
