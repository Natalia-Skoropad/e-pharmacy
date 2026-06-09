import Image from 'next/image';
import type { ReactNode } from 'react';

import { Container } from '../../common/Container';

import css from './StatusPageLayout.module.css';

//===================================================================

type StatusPageLayoutImage = {
  src: string;
  alt?: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
};

type StatusPageLayoutProps = {
  title: string;
  description: string;
  eyebrow?: string;
  titleId?: string;
  actions?: ReactNode;
  image?: StatusPageLayoutImage;
};

//===================================================================

function StatusPageLayout({
  title,
  description,
  eyebrow,
  titleId = 'status-page-title',
  actions,
  image,
}: StatusPageLayoutProps) {
  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby={titleId}>
        <Container>
          <div className={css.heroGrid}>
            <div className={css.content}>
              {eyebrow ? <p className={css.eyebrow}>{eyebrow}</p> : null}

              <h1 className={css.title} id={titleId}>
                {title}
              </h1>

              <p className={css.text}>{description}</p>

              {actions ? <div className={css.actions}>{actions}</div> : null}
            </div>

            {image ? (
              <div className={css.visualCard} aria-hidden="true">
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
    </main>
  );
}

export default StatusPageLayout;

export { StatusPageLayout };
