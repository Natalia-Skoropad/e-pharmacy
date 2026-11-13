'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import clsx from 'clsx';

import { chooseSeedImageSize, normalizeImageSource } from '../image-source';

import {
  chooseManagedPhotoSize,
  type ManagedPhotoSize,
} from '../managed-photo-url';

import css from './ShimmerImage.module.css';

//===============================================================

type Props = Omit<ImageProps, 'fill' | 'alt'> & {
  alt: string;
  className?: string;
  wrapClassName?: string;
  as?: 'div' | 'span';
  mediaSize?: ManagedPhotoSize;
};

//===============================================================

function ShimmerImage({
  className,
  wrapClassName,
  onLoad,
  onError,
  alt,
  as = 'div',
  mediaSize = 'medium',
  ...props
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failedSeedUrl, setFailedSeedUrl] = useState<string | null>(null);

  const originalSource = normalizeImageSource(
    typeof props.src === 'string'
      ? chooseManagedPhotoSize(props.src, mediaSize)
      : props.src
  );

  const seedSource =
    typeof originalSource === 'string'
      ? chooseSeedImageSize(originalSource, mediaSize)
      : originalSource;

  const imageSource =
    seedSource === failedSeedUrl ? originalSource : seedSource;

  const Wrap = as;

  return (
    <Wrap className={clsx(css.wrap, wrapClassName)}>
      <Image
        {...props}
        src={imageSource}
        alt={alt}
        fill
        className={clsx(css.img, className)}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          // WebP derivatives are deployed with the API; keep the original PNG
          // usable during staggered deployments or a temporary asset failure.
          if (
            typeof seedSource === 'string' &&
            seedSource !== originalSource &&
            failedSeedUrl !== seedSource
          ) {
            setFailedSeedUrl(seedSource);
            setLoaded(false);
            return;
          }
          setLoaded(true);
          onError?.(event);
        }}
      />

      <span
        className={clsx(
          css.skeleton,
          (loaded || props.priority) && css.skeletonOff
        )}
        aria-hidden="true"
      />
    </Wrap>
  );
}

export default ShimmerImage;
export { ShimmerImage };
