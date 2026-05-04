'use client';

import { useEffect } from 'react';

import Button from '@/components/common/Button';
import { Container } from '@/components/common';

import css from './error.module.css';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="error-title">
        <Container>
          <div className={css.card}>
            <p className={css.eyebrow}>Something went wrong</p>

            <h1 className={css.title} id="error-title">
              We could not load this page
            </h1>

            <p className={css.text}>
              Please try again. If the issue continues, return to the home page
              and continue from there.
            </p>

            <div className={css.actions}>
              <Button type="button" onClick={reset}>
                Try again
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default ErrorPage;
