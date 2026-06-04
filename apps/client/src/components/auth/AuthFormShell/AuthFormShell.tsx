import { useId, type ReactNode } from 'react';
import Image from 'next/image';

import { Container } from '@e-pharmacy/ui/common';
import { Breadcrumbs } from '@e-pharmacy/ui/layout';
import type { BreadcrumbItem } from '@e-pharmacy/types/navigation';

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
  children,
}: AuthFormShellProps) {
  const titleId = useId();

  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby={titleId}>
        <Container>
          <Breadcrumbs items={breadcrumbs} />

          <div className={css.grid}>
            <div className={css.illustration} aria-hidden="true">
              <Image
                className={css.image}
                src="/images/auth/authorization.png"
                alt=""
                fill
                priority
                fetchPriority="high"
                sizes="(min-width: 1440px) 700px, (min-width: 768px) 704px, calc(100vw - 40px)"
              />
            </div>

            <div className={css.card}>
              <div className={css.cardInner}>
                <div className={css.head}>
                  <h1 className={css.title} id={titleId}>
                    {title}
                  </h1>
                  <p className={css.text}>{text}</p>
                </div>

                {children}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default AuthFormShell;
