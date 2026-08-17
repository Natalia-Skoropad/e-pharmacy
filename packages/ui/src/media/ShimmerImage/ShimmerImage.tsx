'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import clsx from 'clsx';

import { normalizeImageSource } from '../image-source';

import css from './ShimmerImage.module.css';

//===============================================================

type Props = Omit<ImageProps, 'fill' | 'alt'> & {
  alt: string;
  className?: string;
  wrapClassName?: string;
  as?: 'div' | 'span';
};

//===============================================================

function ShimmerImage({
  className,
  wrapClassName,
  onLoad,
  onError,
  alt,
  as = 'div',
  ...props
}: Props) {
  const [loaded, setLoaded] = useState(false);

  const Wrap = as;

  return (
    <Wrap className={clsx(css.wrap, wrapClassName)}>
      <Image
        {...props}
        src={normalizeImageSource(props.src)}
        alt={alt}
        fill
        className={clsx(css.img, className)}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          setLoaded(true);
          onError?.(event);
        }}
      />

      <span
        className={clsx(css.skeleton, loaded && css.skeletonOff)}
        aria-hidden="true"
      />
    </Wrap>
  );
}

export default ShimmerImage;
export { ShimmerImage };
