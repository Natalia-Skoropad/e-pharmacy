import { ButtonLink, Container } from '@/components/common';

import { ROUTES } from '@/lib/constants/routes';

import css from './StatusPage.module.css';

type StatusPageProps = {
  eyebrow?: string;
  title: string;
  text: string;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
};

function StatusPage({
  eyebrow = 'E-PHARMACY',
  title,
  text,
  primaryActionLabel = 'Back to home',
  primaryActionHref = ROUTES.HOME,
  secondaryActionLabel,
  secondaryActionHref,
}: StatusPageProps) {
  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="status-title">
        <Container>
          <div className={css.card}>
            <p className={css.eyebrow}>{eyebrow}</p>

            <h1 className={css.title} id="status-title">
              {title}
            </h1>

            <p className={css.text}>{text}</p>

            <div className={css.actions}>
              <ButtonLink href={primaryActionHref}>
                {primaryActionLabel}
              </ButtonLink>

              {secondaryActionLabel && secondaryActionHref ? (
                <ButtonLink href={secondaryActionHref} variant="secondary">
                  {secondaryActionLabel}
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default StatusPage;
