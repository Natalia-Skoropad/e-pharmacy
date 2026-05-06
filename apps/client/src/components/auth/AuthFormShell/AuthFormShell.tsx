import type { ReactNode } from 'react';

import { Container } from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

import type { BreadcrumbItem } from '@/types/breadcrumbs';

import css from './AuthFormShell.module.css';

//===================================================================

type AuthFormShellProps = {
  title: string;
  text: string;
  breadcrumbs: BreadcrumbItem[];
  children: ReactNode;
};

//===================================================================

function AuthFormShell({
  title,
  text,
  breadcrumbs,
  children,
}: AuthFormShellProps) {
  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="auth-page-title">
        <Container>
          <Breadcrumbs items={breadcrumbs} />

          <div className={css.grid}>
            <div className={css.content}>
              <p className={css.kicker}>E-PHARMACY</p>

              <h1 className={css.title} id="auth-page-title">
                {title}
              </h1>

              <p className={css.text}>{text}</p>
            </div>

            <div className={css.card}>{children}</div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default AuthFormShell;
