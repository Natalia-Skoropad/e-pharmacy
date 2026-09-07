import { Container } from '@e-pharmacy/ui/layout';

import CatalogCardSkeleton from '@/components/catalog/CatalogCardSkeleton/CatalogCardSkeleton';

import css from './CatalogPageLoading.module.css';

//===================================================================

export type CatalogPageLoadingProps = Readonly<{
  label: string;
}>;

//===================================================================

export default function CatalogPageLoading({ label }: CatalogPageLoadingProps) {
  return (
    <main className={css.page} aria-busy="true">
      <section className={css.section}>
        <Container>
          <div className={css.breadcrumbs} aria-hidden="true">
            <span className={css.line} />
            <span className={css.lineShort} />
          </div>

          <div className={css.title} aria-hidden="true" />

          <div className={css.filters} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>

          <CatalogCardSkeleton count={6} label={label} />
        </Container>
      </section>
    </main>
  );
}
