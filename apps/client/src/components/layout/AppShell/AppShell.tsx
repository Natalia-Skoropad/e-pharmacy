import type { ReactNode } from 'react';

import css from './AppShell.module.css';

type AppShellProps = {
  children: ReactNode;
};

function AppShell({ children }: AppShellProps) {
  return <div className={css.shell}>{children}</div>;
}

export default AppShell;
