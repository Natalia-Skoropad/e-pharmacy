import type { ReactNode } from 'react';

import css from './TableToolbar.module.css';

//===================================================================

type TableToolbarProps = Readonly<{
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}>;

//===================================================================

export function TableToolbar({
  title,
  description,
  actions,
  children,
}: TableToolbarProps) {
  return (
    <div className={css.toolbar}>
      <div className={css.titleGroup}>
        <h2 className={css.title}>{title}</h2>
        {description ? <p className={css.description}>{description}</p> : null}
        {children}
      </div>
      {actions ? <div className={css.actions}>{actions}</div> : null}
    </div>
  );
}
