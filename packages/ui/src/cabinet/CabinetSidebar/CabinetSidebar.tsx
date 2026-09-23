'use client';

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import Link from 'next/link';
import clsx from 'clsx';
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { useOutsidePointerDown } from '@e-pharmacy/hooks/dom';

import type {
  NavigationItem,
  NavigationLinkItem,
} from '../../navigation/types';

import Logo from '../../media/Logo/Logo';

import {
  isNavigationGroup,
  isNavigationItemActive,
  isNavigationLinkActive,
} from '../internal/is-navigation-item-active';

import { useNavigationGroupDisclosure } from '../internal/use-navigation-group-disclosure';

import css from './CabinetSidebar.module.css';

//===================================================================

type SidebarItem = NavigationItem<ReactNode>;
type SidebarLinkItem = NavigationLinkItem<ReactNode>;

//===================================================================

type CabinetSidebarLogoRenderProps = {
  href: string;
  className: string;
  children: ReactNode;
  'aria-label': string;
};

type CabinetSidebarLinkRenderProps = {
  item: SidebarLinkItem;
  href: string;
  className: string;
  children: ReactNode;
  'aria-current'?: 'page';
  title?: string;
  onClick?: () => void;
};

//===================================================================

export type CabinetSidebarProps = Readonly<{
  items: readonly SidebarItem[];
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
    item: SidebarLinkItem
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
  const idPrefix = useId();
  const sidebarRef = useRef<HTMLElement | null>(null);
  const groupButtonRefs = useRef(new Map<number, HTMLButtonElement>());

  const [openCollapsedGroupIndex, setOpenCollapsedGroupIndex] = useState<
    number | null
  >(null);

  const groupDisclosure = useNavigationGroupDisclosure(activePath);

  const resolveLinkActive = (item: SidebarLinkItem) =>
    isActive
      ? isActive(item.href, activePath ?? '', item)
      : isNavigationLinkActive(item, activePath);

  const closeCollapsedSubmenu = () => setOpenCollapsedGroupIndex(null);

  useOutsidePointerDown({
    refs: [sidebarRef],
    enabled: isCollapsed && openCollapsedGroupIndex !== null,
    onOutside: closeCollapsedSubmenu,
  });

  useEffect(() => {
    if (isCollapsed) return;
    setOpenCollapsedGroupIndex(null);
  }, [isCollapsed]);

  useEffect(() => {
    if (!isCollapsed || openCollapsedGroupIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      const index = openCollapsedGroupIndex;
      setOpenCollapsedGroupIndex(null);
      groupButtonRefs.current.get(index)?.focus();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCollapsed, openCollapsedGroupIndex]);

  const handleNavigate = () => {
    closeCollapsedSubmenu();
    onNavigate?.();
  };

  const renderNavigationLink = (
    item: SidebarLinkItem,
    linkClassName: string,
    content: ReactNode,
    active: boolean,
    title: string | undefined,
    key: string
  ) => {
    if (item.disabled) {
      return (
        <span
          className={linkClassName}
          aria-disabled="true"
          title={title ?? item.label}
          key={key}
        >
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
            className: linkClassName,
            children: content,
            title,
            'aria-current': active ? 'page' : undefined,
            onClick: handleNavigate,
          })}
        </Fragment>
      );
    }

    return (
      <Link
        href={item.href}
        className={linkClassName}
        aria-current={active ? 'page' : undefined}
        title={title}
        onClick={handleNavigate}
        key={key}
      >
        {content}
      </Link>
    );
  };

  return (
    <aside
      ref={sidebarRef}
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
          {items.map((item, index) => {
            if (isNavigationGroup(item)) {
              const active = isActive
                ? item.children.some(resolveLinkActive)
                : isNavigationItemActive(item, activePath);
              const expanded =
                !item.disabled && groupDisclosure.isExpanded(index, active);
              const collapsedOpen =
                !item.disabled && openCollapsedGroupIndex === index;
              const childrenId = `${idPrefix}-group-${index}`;
              const collapsedChildrenId = `${childrenId}-collapsed`;

              const groupContent = (
                <>
                  {item.icon ? (
                    <span className={css.icon} aria-hidden="true">
                      {item.icon}
                    </span>
                  ) : null}
                  <span className={css.label}>{item.label}</span>
                  <ChevronDown
                    className={clsx(
                      css.groupChevron,
                      expanded && !isCollapsed && css.groupChevronOpen
                    )}
                    size={17}
                    aria-hidden="true"
                  />
                </>
              );

              return (
                <li
                  key={`group-${index}-${item.label}`}
                  className={clsx(css.item, css.groupItem)}
                >
                  <button
                    ref={(element) => {
                      if (element) groupButtonRefs.current.set(index, element);
                      else groupButtonRefs.current.delete(index);
                    }}
                    className={clsx(
                      css.link,
                      css.groupButton,
                      active && css.active,
                      item.disabled && css.disabled
                    )}
                    type="button"
                    disabled={item.disabled}
                    aria-expanded={isCollapsed ? collapsedOpen : expanded}
                    aria-controls={
                      isCollapsed ? collapsedChildrenId : childrenId
                    }
                    title={isCollapsed ? item.label : undefined}
                    onClick={() => {
                      if (isCollapsed) {
                        setOpenCollapsedGroupIndex((current) =>
                          current === index ? null : index
                        );
                        return;
                      }

                      groupDisclosure.toggle(index, active);
                    }}
                  >
                    {groupContent}
                  </button>

                  {!isCollapsed ? (
                    <ul
                      className={clsx(
                        css.children,
                        expanded && css.childrenOpen
                      )}
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
                            <span
                              className={css.childMarker}
                              aria-hidden="true"
                            />
                            <span className={css.label}>{child.label}</span>
                          </>
                        );

                        return (
                          <li className={css.childItem} key={child.href}>
                            {renderNavigationLink(
                              child,
                              childClassName,
                              childContent,
                              childActive,
                              undefined,
                              `child-link-${child.href}`
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : collapsedOpen ? (
                    <div
                      className={css.collapsedSubmenu}
                      id={collapsedChildrenId}
                    >
                      <span className={css.collapsedSubmenuTitle}>
                        {item.label}
                      </span>

                      <ul className={css.collapsedChildren}>
                        {item.children.map((child) => {
                          const childActive = resolveLinkActive(child);
                          const childClassName = clsx(
                            css.collapsedChildLink,
                            childActive && css.active,
                            child.disabled && css.disabled
                          );

                          return (
                            <li key={child.href}>
                              {renderNavigationLink(
                                child,
                                childClassName,
                                child.label,
                                childActive,
                                undefined,
                                `collapsed-child-link-${child.href}`
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            }

            const active = resolveLinkActive(item);
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
                {renderNavigationLink(
                  item,
                  linkClassName,
                  content,
                  active,
                  title,
                  `link-${item.href}`
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
