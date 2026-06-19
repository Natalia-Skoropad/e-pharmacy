'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';

import css from './SideMenu.module.css';

//===================================================================

export type SideMenuItem = {
  label: string;
  href: string;
  icon?: ReactNode;
  disabled?: boolean;
  exact?: boolean;
};

type SideMenuLinkRenderProps = {
  item: SideMenuItem;
  href: string;
  className: string;
  children: ReactNode;
  'aria-current'?: 'page';
  onClick?: () => void;
};

export type SideMenuProps = {
  items: readonly SideMenuItem[];
  activePath?: string;
  ariaLabel: string;
  className?: string;
  showChevron?: boolean;
  onNavigate?: () => void;
  isActive?: (itemHref: string, activePath: string, item: SideMenuItem) => boolean;
  renderLink?: (props: SideMenuLinkRenderProps) => ReactNode;
};

//===================================================================

function getDefaultIsActive(item: SideMenuItem, activePath?: string) {
  if (!activePath) return false;
  if (item.exact) return activePath === item.href;

  return activePath === item.href || activePath.startsWith(`${item.href}/`);
}

//===================================================================

function SideMenu({
  items,
  activePath,
  ariaLabel,
  className,
  showChevron = true,
  onNavigate,
  isActive,
  renderLink,
}: SideMenuProps) {
  if (!items.length) return null;

  return (
    <nav className={clsx(css.menu, className)} aria-label={ariaLabel}>
      <ul className={css.list}>
        {items.map((item) => {
          const active = isActive
            ? isActive(item.href, activePath ?? '', item)
            : getDefaultIsActive(item, activePath);
          const linkClassName = clsx(
            css.link,
            active && css.active,
            item.disabled && css.disabled
          );
          const content = (
            <>
              {item.icon ? (
                <span className={css.icon} aria-hidden="true">
                  {item.icon}
                </span>
              ) : null}

              <span className={css.label}>{item.label}</span>

              {showChevron ? (
                <ChevronRight className={css.chevron} size={18} aria-hidden="true" />
              ) : null}
            </>
          );

          return (
            <li key={item.href} className={css.item}>
              {item.disabled ? (
                <span className={linkClassName} aria-disabled="true">
                  {content}
                </span>
              ) : renderLink ? (
                renderLink({
                  item,
                  href: item.href,
                  className: linkClassName,
                  children: content,
                  'aria-current': active ? 'page' : undefined,
                  onClick: onNavigate,
                })
              ) : (
                <Link
                  href={item.href}
                  className={linkClassName}
                  aria-current={active ? 'page' : undefined}
                  onClick={onNavigate}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default SideMenu;

export { SideMenu };
