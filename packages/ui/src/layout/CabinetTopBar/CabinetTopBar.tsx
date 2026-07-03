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
  navigationToggle?: ReactNode;
  className?: string;
  ariaLabel?: string;
  renderLink?: (props: CabinetTopBarLinkRenderProps) => ReactNode;
}>;

//===================================================================

function CabinetTopBar({
  items,
  actions,
  leadingIcon,
  navigationToggle,
  className,
  ariaLabel = 'Current cabinet page',
  renderLink,
}: CabinetTopBarProps) {
  const hasPathItems = items.length > 0;

  const renderTopBarLink = (
    item: BreadcrumbItem,
    href: string,
    children: ReactNode
  ) => {
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
      {hasPathItems ? (
        <nav className={css.pathNav} aria-label={ariaLabel}>
          <ol className={css.pathList}>
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              const isLinked = Boolean(item.href) && !isLast;
              const text = <span className={css.text}>{item.label}</span>;

              return (
                <li className={css.pathItem} key={`${item.label}-${index}`}>
                  {index === 0 && leadingIcon ? (
                    <span className={css.leadingIcon} aria-hidden="true">
                      {leadingIcon}
                    </span>
                  ) : null}

                  {isLinked ? (
                    renderTopBarLink(item, item.href!, text)
                  ) : (
                    <span className={css.current} aria-current="page">
                      {text}
                    </span>
                  )}

                  {!isLast ? (
                    <ChevronRight
                      className={css.separator}
                      size={17}
                      aria-hidden="true"
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      {actions ? <div className={css.actions}>{actions}</div> : null}

      {navigationToggle ? (
        <div className={css.navigationToggle}>{navigationToggle}</div>
      ) : null}
    </div>
  );
}

export default CabinetTopBar;
export { CabinetTopBar };
