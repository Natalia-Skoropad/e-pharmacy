import type { ReactNode } from 'react';

import css from './DetailsCard.module.css';

//===================================================================

type DetailsCardProps = Readonly<{
  title: string;
  description?: string;
  children: ReactNode;
}>;

//===================================================================

export function DetailsCard({ title, description, children }: DetailsCardProps) {
  return (
    <section className={css.card}>
      <div className={css.header}>
        <h2 className={css.title}>{title}</h2>
        {description ? <p className={css.description}>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
