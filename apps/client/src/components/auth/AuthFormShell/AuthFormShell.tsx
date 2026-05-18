import type { ReactNode } from 'react';

import { Container } from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

import type { BreadcrumbItem } from '@/types/breadcrumbs';

import css from './AuthFormShell.module.css';

//===================================================================

type AuthFormShellProps = {
  title: string;
  text: string;
  descriptionItems?: string[];
  breadcrumbs: BreadcrumbItem[];
  children: ReactNode;
};

//===================================================================

function AuthFormShell({
  title,
  text,
  breadcrumbs,
  descriptionItems = [],
  children,
}: AuthFormShellProps) {
  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="auth-page-title">
        <Container>
          <Breadcrumbs items={breadcrumbs} />

          <div className={css.grid}>
            <div className={css.content}>
              <h1 className={css.title} id="auth-page-title">
                {title}
              </h1>

              <p className={css.text}>{text}</p>

              {descriptionItems.length > 0 ? (
                <ul className={css.list} aria-label="Page benefits">
                  {descriptionItems.map((item) => (
                    <li className={css.item} key={item}>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className={css.card}>{children}</div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default AuthFormShell;
