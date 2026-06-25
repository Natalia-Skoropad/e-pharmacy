import type { ReactNode } from 'react';

import css from './ActionBar.module.css';

//===================================================================

type ActionBarProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

export function ActionBar({ children }: ActionBarProps) {
  return <div className={css.bar}>{children}</div>;
}
