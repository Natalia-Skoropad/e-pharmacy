import type { ReactNode } from 'react';

import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs } from '@e-pharmacy/ui/navigation';

import css from './CatalogPageShell.module.css';

//===================================================================

type BreadcrumbItem = Readonly<{ label: string; href?: string }>;

export type CatalogPageShellProps = Readonly<{
  title: string;
  titleId: string;
  breadcrumbs: readonly BreadcrumbItem[];
  filters: ReactNode;
  notices?: ReactNode;
  results: ReactNode;
  pagination?: ReactNode;
  seo?: ReactNode;
}>;

//===================================================================

function CatalogPageShell({
  title,
  titleId,
  breadcrumbs,
  filters,
  notices,
  results,
  pagination,
  seo,
}: CatalogPageShellProps) {
  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby={titleId}>
        <Container>
          <Breadcrumbs items={breadcrumbs} includeStructuredData />

          <header className={css.sectionHeader}>
            <h1 className={css.sectionTitle} id={titleId}>
              {title}
            </h1>
          </header>

          {filters}
          {notices ? <div className={css.notices}>{notices}</div> : null}
          {results}
          {pagination}
          {seo}
        </Container>
      </section>
    </main>
  );
}

export default CatalogPageShell;
