import type { ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';

import css from './Breadcrumbs.module.css';

//===================================================================

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbLinkRenderProps = {
  item: BreadcrumbItem;
  href: string;
  className: string;
  children: ReactNode;
};

export type BreadcrumbsProps = {
  items: readonly BreadcrumbItem[];
  className?: string;
  ariaLabel?: string;
  includeStructuredData?: boolean;
  createItemUrl?: (href: string) => string;
  homeIcon?: ReactNode;
  separatorIcon?: ReactNode;
  renderLink?: (props: BreadcrumbLinkRenderProps) => ReactNode;
};

//===================================================================

function createBreadcrumbStructuredData(
  items: readonly BreadcrumbItem[],
  createItemUrl?: (href: string) => string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && createItemUrl ? { item: createItemUrl(item.href) } : {}),
    })),
  };
}

//===================================================================

function Breadcrumbs({
  items,
  className,
  ariaLabel = 'Breadcrumbs',
  includeStructuredData = false,
  createItemUrl,
  homeIcon,
  separatorIcon,
  renderLink,
}: BreadcrumbsProps) {
  if (!items?.length) return null;

  const renderBreadcrumbLink = (
    item: BreadcrumbItem,
    href: string,
    children: ReactNode
  ) => {
    if (renderLink) {
      return renderLink({
        item,
        href,
        className: css.link,
        children,
      });
    }

    return (
      <Link href={href} className={css.link}>
        {children}
      </Link>
    );
  };

  return (
    <>
      <nav className={clsx(css.nav, className)} aria-label={ariaLabel}>
        <ol className={css.list}>
          {items.map((item, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === items.length - 1;
            const isLink = Boolean(item.href) && !isLast;
            const content = (
              <>
                {isFirst && homeIcon ? (
                  <span className={css.icon} aria-hidden="true">
                    {homeIcon}
                  </span>
                ) : null}
                <span className={css.linkText}>{item.label}</span>
              </>
            );

            return (
              <li key={`${item.label}-${idx}`} className={css.item}>
                {isLink ? (
                  renderBreadcrumbLink(item, item.href!, content)
                ) : (
                  <span className={css.current} aria-current="page">
                    {item.label}
                  </span>
                )}

                {!isLast ? (
                  <span className={css.sep} aria-hidden="true">
                    {separatorIcon ?? <ChevronRight size={14} />}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>

      {includeStructuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              createBreadcrumbStructuredData(items, createItemUrl)
            ),
          }}
        />
      ) : null}
    </>
  );
}

export default Breadcrumbs;

export { Breadcrumbs };
