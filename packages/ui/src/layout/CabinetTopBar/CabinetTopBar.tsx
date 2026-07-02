import type { ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';

import type { BreadcrumbItem } from '../Breadcrumbs/Breadcrumbs';

import css from './CabinetTopBar.module.css';

//===================================================================

type CabinetTopBarLinkRenderProps = {
  item: BreadcrumbItem;
  href: string;
  className: string;
  children: ReactNode;
};

export type CabinetTopBarProps = Readonly<{
  items: readonly BreadcrumbItem[];
  actions?: ReactNode;
  leadingIcon?: ReactNode;
  className?: string;
  ariaLabel?: string;
  renderLink?: (props: CabinetTopBarLinkRenderProps) => ReactNode;
}>;

//===================================================================

function CabinetTopBar({
  items,
  actions,
  leadingIcon,
  className,
  ariaLabel = 'Current cabinet page',
  renderLink,
}: CabinetTopBarProps) {
  const visibleItems = items.length ? items : [{ label: 'Dashboard' }];

  const renderTopBarLink = (item: BreadcrumbItem, href: string, children: ReactNode) => {
    if (renderLink) {
      return renderLink({ item, href, className: css.link, children });
    }

    return (
      <Link href={href} className={css.link}>
        {children}
      </Link>
    );
  };

  return (
    <div className={clsx(css.topbar, className)}>
      <nav className={css.pathNav} aria-label={ariaLabel}>
        <ol className={css.pathList}>
          {visibleItems.map((item, index) => {
            const isLast = index === visibleItems.length - 1;
            const isLinked = Boolean(item.href) && !isLast;
            const label = (
              <>
                {index === 0 ? (
                  <span className={css.leadingIcon} aria-hidden="true">
                    {leadingIcon ?? null}
                  </span>
                ) : null}
                <span className={css.text}>{item.label}</span>
              </>
            );

            return (
              <li className={css.pathItem} key={`${item.label}-${index}`}>
                {isLinked ? (
                  renderTopBarLink(item, item.href!, label)
                ) : (
                  <span className={css.current} aria-current="page">
                    {label}
                  </span>
                )}

                {!isLast ? (
                  <ChevronRight className={css.separator} size={17} aria-hidden="true" />
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>

      {actions ? <div className={css.actions}>{actions}</div> : null}
    </div>
  );
}

export default CabinetTopBar;
export { CabinetTopBar };
