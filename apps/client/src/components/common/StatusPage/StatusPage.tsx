import Image from 'next/image';
import { Home, Pill, SearchCheck, Store } from 'lucide-react';

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

const STATUS_HELP_ITEMS = [
  {
    title: 'Start from home',
    text: 'Return to the main page and continue with the most useful sections.',
    icon: Home,
  },
  {
    title: 'Search medicines',
    text: 'Open the catalog, filter by category, and compare available offers.',
    icon: Pill,
  },
  {
    title: 'Choose a pharmacy',
    text: 'Check trusted stores, ratings, contacts, and medicine availability.',
    icon: Store,
  },
] as const;

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
  return (
    <main className={css.page}>
      <section className={css.hero} aria-labelledby="status-title">
        <Container>
          <div className={css.heroGrid}>
            <div className={css.content}>
              <p className={css.eyebrow}>{eyebrow}</p>

              <h1 className={css.title} id="status-title">
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
              <span className={css.floatingBadge}>Safe route</span>

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

              <div className={css.searchCard}>
                <SearchCheck size={22} />
                <span>We will guide you back to medicines and pharmacies.</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className={css.helpSection} aria-label="Helpful links">
        <Container>
          <ul className={css.helpList}>
            {STATUS_HELP_ITEMS.map(({ title: itemTitle, text: itemText, icon: Icon }) => (
              <li className={css.helpCard} key={itemTitle}>
                <span className={css.helpIcon} aria-hidden="true">
                  <Icon size={22} />
                </span>

                <div>
                  <h2>{itemTitle}</h2>
                  <p>{itemText}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </main>
  );
}

export default StatusPage;
