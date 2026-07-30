import Image from 'next/image';
import type { ReactNode } from 'react';
import clsx from 'clsx';

import { Container } from '../../layout/Container';

import css from './StatusPageLayout.module.css';

//===================================================================

export type StatusPageLayoutImage = Readonly<{
  src: string;
  alt?: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
}>;

//===================================================================

export type StatusPageLayoutVariant = 'plain' | 'brand';

//===================================================================

export type StatusPageLayoutProps = Readonly<{
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  image?: StatusPageLayoutImage;
  variant?: StatusPageLayoutVariant;
}>;

//===================================================================

function StatusPageLayout({
  title,
  description,
  eyebrow,
  actions,
  image,
  variant = 'plain',
}: StatusPageLayoutProps) {
  const imageIsDecorative = !image?.alt;

  return (
    <div className={clsx(css.page, css[variant])}>
      <section className={css.hero}>
        <Container>
          <div className={clsx(css.heroGrid, !image && css.heroGridCompact)}>
            <div className={css.content}>
              {eyebrow ? <p className={css.eyebrow}>{eyebrow}</p> : null}
              <h1 className={css.title}>{title}</h1>

              <p className={css.text}>{description}</p>
              {actions ? <div className={css.actions}>{actions}</div> : null}
            </div>

            {image ? (
              <div
                className={css.visualCard}
                aria-hidden={imageIsDecorative || undefined}
              >
                <div className={css.imageWrap}>
                  <Image
                    src={image.src}
                    alt={image.alt ?? ''}
                    width={image.width}
                    height={image.height}
                    sizes={
                      image.sizes ??
                      '(min-width: 1440px) 420px, (min-width: 768px) 38vw, 260px'
                    }
                    className={css.image}
                    priority={image.priority}
                    fetchPriority={image.priority ? 'high' : undefined}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </Container>
      </section>
    </div>
  );
}

export default StatusPageLayout;
export { StatusPageLayout };
