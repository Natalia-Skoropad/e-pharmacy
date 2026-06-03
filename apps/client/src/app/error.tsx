'use client';

import Image from 'next/image';

import { Button, ButtonLink, Container } from '@e-pharmacy/ui/common';
import { ROUTES } from '@/lib/constants/routes';

import css from './status-page.module.css';

//===================================================================

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

//===================================================================

function ErrorPage({ error: _error, reset }: ErrorPageProps) {
  void _error;

  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby="error-title">
        <Container>
          <div className={css.heroGrid}>
            <div className={css.content}>
              <p className={css.eyebrow}>Page error</p>

              <h1 className={css.title} id="error-title">
                Something went wrong, but your route is still safe
              </h1>

              <p className={css.text}>
                We could not load this page right now. Try again, or return to a
                stable section and continue choosing medicines and pharmacies.
              </p>

              <div className={css.actions}>
                <Button type="button" size="lg" onClick={reset}>
                  Try again
                </Button>

                <ButtonLink href={ROUTES.HOME} variant="secondary" size="lg">
                  Back to home
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

export default ErrorPage;
