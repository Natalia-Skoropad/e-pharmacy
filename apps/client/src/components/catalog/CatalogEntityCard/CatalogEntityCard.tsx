'use client';

import { useState, type ReactNode } from 'react';
import clsx from 'clsx';

import { ShimmerImage } from '@e-pharmacy/ui/media';
import { SvgIcon } from '@e-pharmacy/ui/primitives';

import {
  CatalogCardHeading,
  useCatalogCardTitleId,
  type CatalogCardHeadingLevel,
} from './CatalogCardSemantics';

import css from './CatalogEntityCard.module.css';

//===================================================================

export type { CatalogCardHeadingLevel } from './CatalogCardSemantics';

//===================================================================

type CatalogCardImage = Readonly<{
  src?: string;
  alt: string;
  fallbackIcon: string;
  fit: 'contain' | 'cover';
  sizes: string;
}>;

//===================================================================

export type CatalogEntityCardProps = Readonly<{
  title: string;
  headingLevel?: CatalogCardHeadingLevel;
  image: CatalogCardImage;
  favoriteAction?: ReactNode;
  metaStart?: ReactNode;
  metaEnd?: ReactNode;
  summaryItems: ReactNode;
  footer: ReactNode;
  footerClassName?: string;
}>;

//===================================================================

function CatalogEntityImage({ image }: Readonly<{ image: CatalogCardImage }>) {
  const [hasImageError, setHasImageError] = useState(false);

  if (!image.src || hasImageError) {
    return (
      <div className={css.imageFallback} aria-hidden="true">
        <SvgIcon name={image.fallbackIcon} size={34} />
      </div>
    );
  }

  return (
    <ShimmerImage
      className={clsx(
        css.image,
        image.fit === 'contain' ? css.imageContain : css.imageCover
      )}
      src={image.src}
      alt={image.alt}
      sizes={image.sizes}
      onError={() => setHasImageError(true)}
    />
  );
}

//===================================================================

function CatalogEntityCard({
  title,
  headingLevel = 2,
  image,
  favoriteAction,
  metaStart,
  metaEnd,
  summaryItems,
  footer,
  footerClassName,
}: CatalogEntityCardProps) {
  const titleId = useCatalogCardTitleId();

  return (
    <article className={css.card} aria-labelledby={titleId}>
      <div className={css.imageWrap}>
        <CatalogEntityImage key={image.src ?? 'image-fallback'} image={image} />

        {favoriteAction ? (
          <div className={css.favoriteWrap}>{favoriteAction}</div>
        ) : null}
      </div>

      <div className={css.content}>
        {metaStart || metaEnd ? (
          <div className={css.metaRow}>
            <div className={css.metaStart}>{metaStart}</div>
            <div className={css.metaEnd}>{metaEnd}</div>
          </div>
        ) : null}

        <CatalogCardHeading
          className={css.title}
          id={titleId}
          level={headingLevel}
        >
          {title}
        </CatalogCardHeading>

        <dl className={css.summaryList}>{summaryItems}</dl>

        <div className={clsx(css.footer, footerClassName)}>{footer}</div>
      </div>
    </article>
  );
}

export default CatalogEntityCard;
