import type { ReactNode } from 'react';

import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';

import css from './AppShell.module.css';

type AppShellProps = {
  children: ReactNode;
};

function AppShell({ children }: AppShellProps) {
  return (
    <div className={css.shell}>
      <Header />

      <div className={css.content}>{children}</div>

      <Footer />
    </div>
  );
}

export default AppShell;
