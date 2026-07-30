import type { ReactNode } from 'react';
import Link from 'next/link';

import type { BreadcrumbItem } from '../types';

//===================================================================

export type BreadcrumbLinkRenderProps = Readonly<{
  item: BreadcrumbItem;
  href: string;
  className: string;
  children: ReactNode;
}>;

export type BreadcrumbTrailClassNames = Readonly<{
  nav: string;
  list: string;
  item: string;
  link: string;
  current: string;
  text: string;
  separator: string;
  leadingIcon?: string;
}>;

export type BreadcrumbTrailProps = Readonly<{
  items: readonly BreadcrumbItem[];
  ariaLabel: string;
  classNames: BreadcrumbTrailClassNames;
  leadingIcon?: ReactNode;
  separatorIcon: ReactNode;
  renderLink?: (props: BreadcrumbLinkRenderProps) => ReactNode;
}>;

//===================================================================

export function BreadcrumbTrail({
  items,
  ariaLabel,
  classNames,
  leadingIcon,
  separatorIcon,
  renderLink,
}: BreadcrumbTrailProps) {
  if (items.length === 0) return null;

  return (
    <nav className={classNames.nav} aria-label={ariaLabel}>
      <ol className={classNames.list}>
        {items.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;
          
          const content = (
            <>
              {isFirst && leadingIcon ? (
                <span className={classNames.leadingIcon} aria-hidden="true">
                  {leadingIcon}
                </span>
              ) : null}
              <span className={classNames.text}>{item.label}</span>
            </>
          );

          return (
            <li className={classNames.item} key={`${item.label}-${index}`}>
              {item.href && !isLast ? (
                renderLink ? (
                  renderLink({
                    item,
                    href: item.href,
                    className: classNames.link,
                    children: content,
                  })
                ) : (
                  <Link className={classNames.link} href={item.href}>
                    {content}
                  </Link>
                )
              ) : (
                <span className={classNames.current} aria-current="page">
                  {content}
                </span>
              )}

              {!isLast ? (
                <span className={classNames.separator} aria-hidden="true">
                  {separatorIcon}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
