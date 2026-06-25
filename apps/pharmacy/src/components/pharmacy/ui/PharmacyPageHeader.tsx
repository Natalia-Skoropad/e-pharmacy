import type { ReactNode } from 'react';

import css from './PharmacyPageHeader.module.css';

//===================================================================

type PharmacyPageHeaderProps = Readonly<{
  title: string;
  description?: string;
  kicker?: string;
  actions?: ReactNode;
}>;

//===================================================================

export function PharmacyPageHeader({
  title,
  description,
  kicker = 'Pharmacy cabinet',
  actions,
}: PharmacyPageHeaderProps) {
  return (
    <header className={css.header}>
      <div className={css.content}>
        <p className={css.kicker}>{kicker}</p>
        <h2 className={css.title}>{title}</h2>
        {description ? <p className={css.description}>{description}</p> : null}
      </div>
      {actions}
    </header>
  );
}
