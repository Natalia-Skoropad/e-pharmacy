import type { ReactNode } from 'react';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';

import type { BreadcrumbItem } from '../types';

import {
  BreadcrumbTrail,
  type BreadcrumbLinkRenderProps,
} from '../internal/BreadcrumbTrail';

import css from './Breadcrumbs.module.css';

//===================================================================

export type BreadcrumbsProps = Readonly<{
  items: readonly BreadcrumbItem[];
  className?: string;
  ariaLabel?: string;
  includeStructuredData?: boolean;
  createItemUrl?: (href: string) => string;
  homeIcon?: ReactNode;
  separatorIcon?: ReactNode;
  renderLink?: (props: BreadcrumbLinkRenderProps) => ReactNode;
}>;

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
  if (items.length === 0) return null;

  return (
    <>
      <BreadcrumbTrail
        items={items}
        ariaLabel={ariaLabel}
        leadingIcon={homeIcon}
        separatorIcon={separatorIcon ?? <ChevronRight size={14} />}
        renderLink={renderLink}
        classNames={{
          nav: clsx(css.nav, className),
          list: css.list,
          item: css.item,
          link: css.link,
          current: css.current,
          text: css.linkText,
          separator: css.sep,
          leadingIcon: css.icon,
        }}
      />

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
