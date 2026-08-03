import type { ReactNode } from 'react';

import css from './CatalogSeoCard.module.css';

//===================================================================

export type CatalogSeoCardProps = Readonly<{
  title: string;
  titleId: string;
  children: ReactNode;
}>;

//===================================================================

function CatalogSeoCard({ title, titleId, children }: CatalogSeoCardProps) {
  return (
    <section className={css.card} aria-labelledby={titleId}>
      <h2 className={css.title} id={titleId}>
        {title}
      </h2>

      <div className={css.content}>{children}</div>
    </section>
  );
}

export default CatalogSeoCard;
