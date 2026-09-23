'use client';

import { Fragment, useId, type ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ChevronDown, ChevronRight } from 'lucide-react';

import type {
  NavigationItem,
  NavigationLinkItem,
} from '../../navigation/types';

import {
  isNavigationGroup,
  isNavigationItemActive,
  isNavigationLinkActive,
} from '../internal/is-navigation-item-active';

import { useNavigationGroupDisclosure } from '../internal/use-navigation-group-disclosure';

import css from './SideMenu.module.css';

//===================================================================

type SideMenuItem = NavigationItem<ReactNode>;
type SideMenuLinkItem = NavigationLinkItem<ReactNode>;

//===================================================================

type SideMenuLinkRenderProps = {
  item: SideMenuLinkItem;
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

  isActive?: (
    itemHref: string,
    activePath: string,
    item: SideMenuLinkItem
  ) => boolean;

  renderLink?: (props: SideMenuLinkRenderProps) => ReactNode;
};

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
  const idPrefix = useId();
  const groupDisclosure = useNavigationGroupDisclosure(activePath);

  if (!items.length) return null;

  const resolveLinkActive = (item: SideMenuLinkItem) =>
    isActive
      ? isActive(item.href, activePath ?? '', item)
      : isNavigationLinkActive(item, activePath);

  const renderNavigationLink = (
    item: SideMenuLinkItem,
    className: string,
    content: ReactNode,
    active: boolean,
    key: string
  ) => {
    if (item.disabled) {
      return (
        <span className={className} aria-disabled="true" key={key}>
          {content}
        </span>
      );
    }

    if (renderLink) {
      return (
        <Fragment key={key}>
          {renderLink({
            item,
            href: item.href,
            className,
            children: content,
            'aria-current': active ? 'page' : undefined,
            onClick: onNavigate,
          })}
        </Fragment>
      );
    }

    return (
      <Link
        href={item.href}
        className={className}
        aria-current={active ? 'page' : undefined}
        onClick={onNavigate}
        key={key}
      >
        {content}
      </Link>
    );
  };

  return (
    <nav className={clsx(css.menu, className)} aria-label={ariaLabel}>
      <ul className={css.list}>
        {items.map((item, index) => {
          if (isNavigationGroup(item)) {
            const active = isActive
              ? item.children.some(resolveLinkActive)
              : isNavigationItemActive(item, activePath);
            const expanded =
              !item.disabled && groupDisclosure.isExpanded(index, active);
            const childrenId = `${idPrefix}-group-${index}`;

            return (
              <li
                className={clsx(css.item, css.groupItem)}
                key={`group-${index}-${item.label}`}
              >
                <button
                  className={clsx(
                    css.link,
                    css.groupButton,
                    active && css.active,
                    item.disabled && css.disabled
                  )}
                  type="button"
                  disabled={item.disabled}
                  aria-expanded={expanded}
                  aria-controls={childrenId}
                  onClick={() => groupDisclosure.toggle(index, active)}
                >
                  {item.icon ? (
                    <span className={css.icon} aria-hidden="true">
                      {item.icon}
                    </span>
                  ) : null}

                  <span className={css.label}>{item.label}</span>

                  <ChevronDown
                    className={clsx(
                      css.groupChevron,
                      expanded && css.groupChevronOpen
                    )}
                    size={18}
                    aria-hidden="true"
                  />
                </button>

                <ul
                  className={clsx(css.children, expanded && css.childrenOpen)}
                  id={childrenId}
                  hidden={!expanded}
                >
                  {item.children.map((child) => {
                    const childActive = resolveLinkActive(child);
                    const childClassName = clsx(
                      css.link,
                      css.childLink,
                      childActive && css.active,
                      child.disabled && css.disabled
                    );

                    const childContent = (
                      <>
                        <span className={css.childMarker} aria-hidden="true" />
                        <span className={css.label}>{child.label}</span>

                        {showChevron ? (
                          <ChevronRight
                            className={css.chevron}
                            size={18}
                            aria-hidden="true"
                          />
                        ) : null}
                      </>
                    );

                    return (
                      <li className={css.childItem} key={child.href}>
                        {renderNavigationLink(
                          child,
                          childClassName,
                          childContent,
                          childActive,
                          `child-link-${child.href}`
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          }

          const active = resolveLinkActive(item);
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
                <ChevronRight
                  className={css.chevron}
                  size={18}
                  aria-hidden="true"
                />
              ) : null}
            </>
          );

          return (
            <li key={item.href} className={css.item}>
              {renderNavigationLink(
                item,
                linkClassName,
                content,
                active,
                `link-${item.href}`
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
