import Link from 'next/link';
import clsx from 'clsx';
import { ChevronRight, Home } from 'lucide-react';

import css from './Breadcrumbs.module.css';

//===================================================================

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
  includeStructuredData?: boolean;
  createItemUrl?: (href: string) => string;
};

//===================================================================

function createBreadcrumbStructuredData(
  items: BreadcrumbItem[],
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
  includeStructuredData = false,
  createItemUrl,
}: BreadcrumbsProps) {
  if (!items?.length) return null;

  return (
    <>
      <nav className={clsx(css.nav, className)} aria-label="Breadcrumbs">
        <ul className={css.list}>
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            const isLink = Boolean(item.href) && !isLast;

            return (
              <li key={`${item.label}-${idx}`} className={css.item}>
                {idx === 0 && item.href && !isLast ? (
                  <Link href={item.href} className={css.link}>
                    <Home
                      size={16}
                      className={css.homeIcon}
                      aria-hidden="true"
                    />
                    <span className={css.linkText}>{item.label}</span>
                  </Link>
                ) : isLink ? (
                  <Link href={item.href!} className={css.link}>
                    <span className={css.linkText}>{item.label}</span>
                  </Link>
                ) : (
                  <span className={css.current} aria-current="page">
                    {item.label}
                  </span>
                )}

                {!isLast ? (
                  <ChevronRight
                    size={14}
                    className={css.sep}
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
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
