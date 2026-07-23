'use client';

import {
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { createPortal } from 'react-dom';
import clsx from 'clsx';

import css from './Tabs.module.css';

//===================================================================

export type TabItem<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export type TabsLabels = {
  moreButton?: string;
};

type TabsProps<TValue extends string = string> = {
  items: TabItem<TValue>[];
  activeValue: TValue;
  ariaLabel: string;
  onChange: (value: TValue) => void;
  mobileVisibleCount?: number;
  tabletVisibleCount?: number;
  labels?: TabsLabels;
};

//===================================================================

const MOBILE_VISIBLE_TABS_COUNT = 1;

const DEFAULT_LABELS: Required<TabsLabels> = {
  moreButton: 'Open other tabs',
};

//===================================================================

type MoreMenuMode = 'mobile' | 'tablet' | null;

type MoreMenuPosition = Readonly<{
  top: number;
  left: number;
}>;

//===================================================================

const MORE_MENU_WIDTH = 210;
const MORE_MENU_OFFSET = 15;
const VIEWPORT_GUTTER = 12;

//===================================================================

function getMoreMenuPosition(button: HTMLButtonElement): MoreMenuPosition {
  const rect = button.getBoundingClientRect();
  const maximumLeft = Math.max(
    VIEWPORT_GUTTER,
    window.innerWidth - MORE_MENU_WIDTH - VIEWPORT_GUTTER
  );

  return {
    top: rect.bottom + MORE_MENU_OFFSET,
    left: Math.min(
      Math.max(VIEWPORT_GUTTER, rect.right - MORE_MENU_WIDTH),
      maximumLeft
    ),
  };
}

//===================================================================

function Tabs<TValue extends string = string>({
  items,
  activeValue,
  ariaLabel,
  onChange,
  mobileVisibleCount = MOBILE_VISIBLE_TABS_COUNT,
  tabletVisibleCount,
  labels,
}: TabsProps<TValue>) {
  const [moreMenuMode, setMoreMenuMode] = useState<MoreMenuMode>(null);
  const [moreMenuPosition, setMoreMenuPosition] =
    useState<MoreMenuPosition | null>(null);

  const tabsRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef(new Map<TValue, HTMLButtonElement>());
  const mobileMoreButtonRef = useRef<HTMLButtonElement>(null);
  const tabletMoreButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMoreMenuId = useId();
  const tabletMoreMenuId = useId();
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };
  const isMoreOpen = moreMenuMode !== null;

  const normalizedMobileVisibleCount = Math.max(
    0,
    Math.min(mobileVisibleCount, items.length)
  );

  const normalizedTabletVisibleCount = Math.max(
    0,
    Math.min(tabletVisibleCount ?? items.length, items.length)
  );

  const moreMobileItems = items.slice(normalizedMobileVisibleCount);
  const moreTabletItems = items.slice(normalizedTabletVisibleCount);
  const hasMoreMobileItems = moreMobileItems.length > 0;
  const hasMoreTabletItems = moreTabletItems.length > 0;
  const hasMoreItems = hasMoreMobileItems || hasMoreTabletItems;

  const isMoreMobileActive = moreMobileItems.some(
    (item) => item.value === activeValue
  );

  const isMoreTabletActive = moreTabletItems.some(
    (item) => item.value === activeValue
  );

  useEffect(() => {
    if (!isMoreOpen) return;

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        tabsRef.current?.contains(target) ||
        moreMenuRef.current?.contains(target)
      ) {
        return;
      }

      setMoreMenuMode(null);
      setMoreMenuPosition(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreMenuMode(null);
        setMoreMenuPosition(null);
      }
    };

    const updateMenuPosition = () => {
      const button =
        moreMenuMode === 'mobile'
          ? mobileMoreButtonRef.current
          : tabletMoreButtonRef.current;

      if (!button || button.offsetParent === null) {
        setMoreMenuMode(null);
        setMoreMenuPosition(null);
        return;
      }

      setMoreMenuPosition(getMoreMenuPosition(button));
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isMoreOpen, moreMenuMode]);

  const isElementVisible = (element: HTMLElement | null) => {
    if (!element) return false;

    return element.offsetParent !== null;
  };

  const focusVisibleTabControl = (value: TValue) => {
    window.setTimeout(() => {
      const tabButton = tabButtonRefs.current.get(value);

      if (isElementVisible(tabButton ?? null)) {
        tabButton?.focus();
        return;
      }

      if (isElementVisible(mobileMoreButtonRef.current)) {
        mobileMoreButtonRef.current?.focus();
        return;
      }

      if (isElementVisible(tabletMoreButtonRef.current)) {
        tabletMoreButtonRef.current?.focus();
      }
    }, 0);
  };

  const handleTabClick = (value: TValue) => {
    onChange(value);
    setMoreMenuMode(null);
    setMoreMenuPosition(null);
  };

  const handleMoreButtonClick = (
    mode: Exclude<MoreMenuMode, null>,
    button: HTMLButtonElement
  ) => {
    if (moreMenuMode === mode) {
      setMoreMenuMode(null);
      setMoreMenuPosition(null);
      return;
    }

    setMoreMenuPosition(getMoreMenuPosition(button));
    setMoreMenuMode(mode);
  };

  const handleTabKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    const lastIndex = items.length - 1;
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
        break;
      case 'ArrowRight':
        nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = lastIndex;
        break;
      default:
        return;
    }

    event.preventDefault();

    const nextItem = items[nextIndex];

    if (!nextItem) return;

    handleTabClick(nextItem.value);
    focusVisibleTabControl(nextItem.value);
  };

  const renderMoreMenu = (
    mode: Exclude<MoreMenuMode, null>,
    menuId: string,
    menuItems: TabItem<TValue>[]
  ) => {
    if (
      moreMenuMode !== mode ||
      !moreMenuPosition ||
      typeof document === 'undefined'
    ) {
      return null;
    }

    return createPortal(
      <div
        className={css.moreMenu}
        id={menuId}
        ref={moreMenuRef}
        role="menu"
        style={{
          top: moreMenuPosition.top,
          left: moreMenuPosition.left,
        }}
      >
        {menuItems.map((item) => {
          const isActive = item.value === activeValue;

          return (
            <button
              className={isActive ? css.moreItemActive : css.moreItem}
              key={item.value}
              type="button"
              role="menuitemradio"
              aria-checked={isActive}
              onClick={() => handleTabClick(item.value)}
            >
              {item.label}
            </button>
          );
        })}
      </div>,
      document.body
    );
  };

  return (
    <div
      className={css.tabs}
      role="tablist"
      aria-label={ariaLabel}
      ref={tabsRef}
    >
      {items.map((item, index) => {
        const isActive = item.value === activeValue;
        const isHiddenOnMobile = index >= normalizedMobileVisibleCount;
        const isHiddenOnTablet = index >= normalizedTabletVisibleCount;

        return (
          <button
            className={clsx(
              isActive ? css.tabActive : css.tab,
              isHiddenOnMobile && css.tabHiddenOnMobile,
              isHiddenOnTablet && css.tabHiddenOnTablet
            )}
            key={item.value}
            ref={(node) => {
              if (node) {
                tabButtonRefs.current.set(item.value, node);
              } else {
                tabButtonRefs.current.delete(item.value);
              }
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleTabClick(item.value)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {item.label}
          </button>
        );
      })}

      {hasMoreItems ? (
        <>
          {hasMoreMobileItems ? (
            <div className={clsx(css.moreWrap, css.mobileMoreWrap)}>
              <button
                className={clsx(
                  isMoreMobileActive ? css.tabActive : css.tab,
                  css.moreButton
                )}
                ref={mobileMoreButtonRef}
                type="button"
                aria-label={mergedLabels.moreButton}
                aria-haspopup="menu"
                aria-expanded={moreMenuMode === 'mobile'}
                aria-controls={mobileMoreMenuId}
                onClick={(event) =>
                  handleMoreButtonClick('mobile', event.currentTarget)
                }
              >
                <span className={css.moreIcon} aria-hidden="true">
                  ...
                </span>
              </button>

              {renderMoreMenu('mobile', mobileMoreMenuId, moreMobileItems)}
            </div>
          ) : null}

          {hasMoreTabletItems ? (
            <div className={clsx(css.moreWrap, css.tabletMoreWrap)}>
              <button
                className={clsx(
                  isMoreTabletActive ? css.tabActive : css.tab,
                  css.moreButton
                )}
                ref={tabletMoreButtonRef}
                type="button"
                aria-label={mergedLabels.moreButton}
                aria-haspopup="menu"
                aria-expanded={moreMenuMode === 'tablet'}
                aria-controls={tabletMoreMenuId}
                onClick={(event) =>
                  handleMoreButtonClick('tablet', event.currentTarget)
                }
              >
                <span className={css.moreIcon} aria-hidden="true">
                  ...
                </span>
              </button>

              {renderMoreMenu('tablet', tabletMoreMenuId, moreTabletItems)}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export default Tabs;
export { Tabs };
