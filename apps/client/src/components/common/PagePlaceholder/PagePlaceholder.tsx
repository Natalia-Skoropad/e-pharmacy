import { useId } from 'react';

import { ButtonLink, Container } from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

import { ROUTES } from '@/lib/constants/routes';

import type { BreadcrumbItem } from '@/types/breadcrumbs';

import css from './PagePlaceholder.module.css';

//===================================================================

type PagePlaceholderProps = {
  title: string;
  text: string;
  breadcrumbs: BreadcrumbItem[];
};

//===================================================================

function PagePlaceholder({ title, text, breadcrumbs }: PagePlaceholderProps) {
  const titleId = useId();

  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby={titleId}>
        <Container>
          <Breadcrumbs items={breadcrumbs} />

          <div className={css.card}>
            <p className={css.kicker}>E-PHARMACY</p>

            <h1 className={css.title} id={titleId}>
              {title}
            </h1>

            <p className={css.text}>{text}</p>

            <ButtonLink href={ROUTES.HOME} variant="secondary">
              Back to home
            </ButtonLink>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default PagePlaceholder;
