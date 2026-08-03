import type { ReactNode } from 'react';

import css from './ProductOrderInfoCard.module.css';

//===================================================================

export type ProductOrderInfoCardProps = Readonly<{
  icon: ReactNode;
  title: string;
  items: readonly string[];
  notice?: string;
}>;

//===================================================================

export function ProductOrderInfoCard({
  icon,
  title,
  items,
  notice,
}: ProductOrderInfoCardProps) {
  return (
    <article className={css.card}>
      <span className={css.icon} aria-hidden="true">
        {icon}
      </span>

      <div>
        <h2 className={css.title}>{title}</h2>

        <ul className={css.list}>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>

        {notice ? <p className={css.notice}>{notice}</p> : null}
      </div>
    </article>
  );
}
