'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { Home, RefreshCw, ShieldCheck, Store } from 'lucide-react';

import { Button, ButtonLink, Container } from '@/components/common';

import { ROUTES } from '@/lib/constants/routes';

import css from './error.module.css';

//===================================================================

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

//===================================================================

const RECOVERY_ITEMS = [
  {
    title: 'Try to reload',
    text: 'Refresh this page and we will request the latest data again.',
    icon: RefreshCw,
  },
  {
    title: 'Return safely',
    text: 'Go back home and continue from the main shopping routes.',
    icon: Home,
  },
  {
    title: 'Open stores',
    text: 'Browse pharmacy stores while this page gets back on its feet.',
    icon: Store,
  },
] as const;

//===================================================================

function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
              <span className={css.floatingBadge}>Recovery mode</span>

              <div className={css.imageWrap}>
                <Image
                  src="/images/common/two-pills.png"
                  alt=""
                  fill
                  sizes="(min-width: 1440px) 420px, (min-width: 768px) 38vw, 260px"
                  className={css.image}
                  priority
                />
              </div>

              <div className={css.noteCard}>
                <ShieldCheck size={22} />
                <span>Temporary glitch. The app can try this route again.</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className={css.recoverySection} aria-label="Recovery options">
        <Container>
          <ul className={css.recoveryList}>
            {RECOVERY_ITEMS.map(({ title, text, icon: Icon }) => (
              <li className={css.recoveryCard} key={title}>
                <span className={css.recoveryIcon} aria-hidden="true">
                  <Icon size={22} />
                </span>

                <div>
                  <h2>{title}</h2>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </main>
  );
}

export default ErrorPage;
