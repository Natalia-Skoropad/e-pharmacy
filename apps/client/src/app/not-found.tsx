import Image from 'next/image';

import { ButtonLink, Container } from '@e-pharmacy/ui/common';
import { ROUTES } from '@/lib/constants/routes';

import css from './status-page.module.css';

//===================================================================

function NotFoundPage() {
  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby="not-found-title">
        <Container>
          <div className={css.heroGrid}>
            <div className={css.content}>
              <p className={css.eyebrow}>404</p>

              <h1 className={css.title} id="not-found-title">
                Page not found
              </h1>

              <p className={css.text}>
                The link may be outdated, moved, or typed with a tiny typo. Go
                back home or open the medicine catalog to continue shopping
                safely.
              </p>

              <div className={css.actions}>
                <ButtonLink href={ROUTES.HOME} size="lg">
                  Back to home
                </ButtonLink>

                <ButtonLink
                  href={ROUTES.MEDICINES_CATALOG}
                  variant="secondary"
                  size="lg"
                >
                  View medicine catalog
                </ButtonLink>
              </div>
            </div>

            <div className={css.visualCard} aria-hidden="true">
              <div className={css.imageWrap}>
                <Image
                  src="/images/home/three-pills.png"
                  alt=""
                  width={749}
                  height={508}
                  sizes="(min-width: 1440px) 420px, (min-width: 768px) 38vw, 260px"
                  className={css.image}
                  priority
                  fetchPriority="high"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default NotFoundPage;
