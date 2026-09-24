import { useId, type ReactNode } from 'react';
import Image from 'next/image';

import { Container } from '../../layout';
import { Breadcrumbs, type BreadcrumbItem } from '../../navigation';

import css from './AuthPageShell.module.css';

//===================================================================

type AuthPageShellProps = {
  title: string;
  text: string;
  breadcrumbs: BreadcrumbItem[];
  children: ReactNode;
  illustrationSrc?: string;
  illustrationAlt?: string;
  showHeader?: boolean;
  showDescription?: boolean;
};

//===================================================================

function AuthPageShell({
  title,
  text,
  breadcrumbs,
  children,
  illustrationSrc = '/images/auth/authorization.png',
  illustrationAlt = '',
  showHeader = true,
  showDescription = true,
}: AuthPageShellProps) {
  const titleId = useId();

  return (
    <main className={css.page}>
      <section
        className={css.section}
        aria-label={showHeader ? undefined : title}
        aria-labelledby={showHeader ? titleId : undefined}
      >
        <Container>
          <Breadcrumbs items={breadcrumbs} />

          <div className={css.grid}>
            <div
              className={css.illustration}
              aria-hidden={illustrationAlt ? undefined : true}
            >
              <Image
                className={css.image}
                src={illustrationSrc}
                alt={illustrationAlt}
                fill
                priority
                fetchPriority="high"
                sizes="(min-width: 1440px) 700px, (min-width: 768px) 704px, calc(100vw - 40px)"
              />
            </div>

            <div className={css.card}>
              <div className={css.cardInner}>
                {showHeader ? (
                  <div className={css.head}>
                    <h1 className={css.title} id={titleId}>
                      {title}
                    </h1>
                    {showDescription && text ? (
                      <p className={css.text}>{text}</p>
                    ) : null}
                  </div>
                ) : null}

                {children}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export type { AuthPageShellProps };
export default AuthPageShell;
