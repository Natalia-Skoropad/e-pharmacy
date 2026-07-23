'use client';

import type { ReactNode } from 'react';
import type { NavigationItem } from '@e-pharmacy/types/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import Logo from '../../common/Logo/Logo';
import { isNavigationItemActive } from '../internal/is-navigation-item-active';

import css from './CabinetSidebar.module.css';

//===================================================================

type SideMenuItem = NavigationItem<ReactNode>;

type CabinetSidebarLogoRenderProps = {
  href: string;
  className: string;
  children: ReactNode;
  'aria-label': string;
};

type CabinetSidebarLinkRenderProps = {
  item: SideMenuItem;
  href: string;
  className: string;
  children: ReactNode;
  'aria-current'?: 'page';
  title?: string;
  onClick?: () => void;
};

//===================================================================

export type CabinetSidebarProps = Readonly<{
  items: readonly SideMenuItem[];
  activePath?: string;
  ariaLabel: string;
  logoHref?: string;
  logoLabel?: string;
  logoAriaLabel?: string;
  isCollapsed?: boolean;
  collapseLabel?: string;
  expandLabel?: string;
  className?: string;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;

  isActive?: (
    itemHref: string,
    activePath: string,
    item: SideMenuItem
  ) => boolean;

  renderLogoLink?: (props: CabinetSidebarLogoRenderProps) => ReactNode;
  renderLink?: (props: CabinetSidebarLinkRenderProps) => ReactNode;
}>;

//===================================================================

function CabinetSidebar({
  items,
  activePath,
  ariaLabel,
  logoHref = '/',
  logoLabel = 'E-PHARMACY',
  logoAriaLabel,
  isCollapsed = false,
  collapseLabel = 'Collapse sidebar',
  expandLabel = 'Expand sidebar',
  className,
  onToggleCollapsed,
  onNavigate,
  isActive,
  renderLogoLink,
  renderLink,
}: CabinetSidebarProps) {
  return (
    <aside
      className={clsx(css.sidebar, isCollapsed && css.collapsed, className)}
      aria-label={ariaLabel}
    >
      <div className={css.header}>
        <Logo
          className={css.logo}
          href={logoHref}
          label={logoLabel}
          showText={!isCollapsed}
          ariaLabel={logoAriaLabel ?? `${logoLabel} dashboard`}
          renderLink={renderLogoLink}
        />

        {onToggleCollapsed ? (
          <button
            className={css.toggleButton}
            type="button"
            aria-label={isCollapsed ? expandLabel : collapseLabel}
            aria-expanded={!isCollapsed}
            onClick={onToggleCollapsed}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={15} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={15} aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      <span className={css.divider} aria-hidden="true" />

      <nav className={css.nav} aria-label={ariaLabel}>
        <ul className={css.list}>
          {items.map((item) => {
            const active = isActive
              ? isActive(item.href, activePath ?? '', item)
              : isNavigationItemActive(item, activePath);
            const linkClassName = clsx(
              css.link,
              active && css.active,
              item.disabled && css.disabled
            );
            const title = isCollapsed ? item.label : undefined;
            const content = (
              <>
                {item.icon ? (
                  <span className={css.icon} aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}

                <span className={css.label}>{item.label}</span>
              </>
            );

            return (
              <li key={item.href} className={css.item}>
                {item.disabled ? (
                  <span
                    className={linkClassName}
                    aria-disabled="true"
                    title={item.label}
                  >
                    {content}
                  </span>
                ) : renderLink ? (
                  renderLink({
                    item,
                    href: item.href,
                    className: linkClassName,
                    children: content,
                    title,
                    'aria-current': active ? 'page' : undefined,
                    onClick: onNavigate,
                  })
                ) : (
                  <Link
                    href={item.href}
                    className={linkClassName}
                    aria-current={active ? 'page' : undefined}
                    title={title}
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
    </aside>
  );
}

export default CabinetSidebar;
export { CabinetSidebar };
