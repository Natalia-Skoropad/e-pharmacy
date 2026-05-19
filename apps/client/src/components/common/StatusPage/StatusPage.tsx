import { useId } from 'react';

import Image from 'next/image';

import { ButtonLink, Container } from '@/components/common';

import { ROUTES } from '@/lib/constants/routes';

import css from './StatusPage.module.css';

//===================================================================

type StatusPageProps = {
  eyebrow?: string;
  title: string;
  text: string;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
};

//===================================================================

function StatusPage({
  eyebrow = 'E-PHARMACY',
  title,
  text,
  primaryActionLabel = 'Back to home',
  primaryActionHref = ROUTES.HOME,
  secondaryActionLabel,
  secondaryActionHref,
}: StatusPageProps) {
  const titleId = useId();

  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby={titleId}>
        <Container>
          <div className={css.heroGrid}>
            <div className={css.content}>
              <p className={css.statusCode}>{eyebrow}</p>

              <h1 className={css.title} id={titleId}>
                {title}
              </h1>

              <p className={css.text}>{text}</p>

              <div className={css.actions}>
                <ButtonLink href={primaryActionHref} size="lg">
                  {primaryActionLabel}
                </ButtonLink>

                {secondaryActionLabel && secondaryActionHref ? (
                  <ButtonLink
                    href={secondaryActionHref}
                    variant="secondary"
                    size="lg"
                  >
                    {secondaryActionLabel}
                  </ButtonLink>
                ) : null}
              </div>
            </div>

            <div className={css.visualCard} aria-hidden="true">
              <div className={css.imageWrap}>
                <Image
                  src="/images/home/three-pills.png"
                  alt=""
                  fill
                  sizes="(min-width: 1440px) 420px, (min-width: 768px) 38vw, 260px"
                  className={css.image}
                  priority
                />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default StatusPage;
