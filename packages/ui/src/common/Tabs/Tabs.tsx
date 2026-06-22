'use client';

import {
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

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

function Tabs<TValue extends string = string>({
  items,
  activeValue,
  ariaLabel,
  onChange,
  mobileVisibleCount = MOBILE_VISIBLE_TABS_COUNT,
  tabletVisibleCount,
  labels,
}: TabsProps<TValue>) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const tabsRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef(new Map<TValue, HTMLButtonElement>());
  const mobileMoreButtonRef = useRef<HTMLButtonElement>(null);
  const tabletMoreButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMoreMenuId = useId();
  const tabletMoreMenuId = useId();
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };

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
      if (!tabsRef.current?.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMoreOpen]);

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
    setIsMoreOpen(false);
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
                aria-expanded={isMoreOpen}
                aria-controls={mobileMoreMenuId}
                onClick={() => setIsMoreOpen((prev) => !prev)}
              >
                <span className={css.moreIcon} aria-hidden="true">
                  ...
                </span>
              </button>

              {isMoreOpen ? (
                <div className={css.moreMenu} id={mobileMoreMenuId} role="menu">
                  {moreMobileItems.map((item) => {
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
                </div>
              ) : null}
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
                aria-expanded={isMoreOpen}
                aria-controls={tabletMoreMenuId}
                onClick={() => setIsMoreOpen((prev) => !prev)}
              >
                <span className={css.moreIcon} aria-hidden="true">
                  ...
                </span>
              </button>

              {isMoreOpen ? (
                <div className={css.moreMenu} id={tabletMoreMenuId} role="menu">
                  {moreTabletItems.map((item) => {
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
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export default Tabs;

export { Tabs };
