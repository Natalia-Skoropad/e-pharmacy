import type { ReactNode } from 'react';

import Footer from '@/components/layout/Footer/Footer';
import Header from '@/components/layout/Header/Header';
import ScrollToTopButton from './ScrollToTopButton';

import css from './AppShell.module.css';

//===================================================================

type AppShellProps = Readonly<{ children: ReactNode }>;

//===================================================================

function AppShell({ children }: AppShellProps) {
  return (
    <div className={css.shell}>
      <Header />

      <div className={css.content} id="main-content" tabIndex={-1}>
        {children}
      </div>

      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

export default AppShell;
