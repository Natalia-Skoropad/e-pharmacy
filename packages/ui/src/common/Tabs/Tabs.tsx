'use client';

import { useEffect, useId, useRef, useState } from 'react';
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
  labels,
}: TabsProps<TValue>) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const tabsRef = useRef<HTMLDivElement>(null);
  const moreMenuId = useId();
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };

  const moreMobileItems = items.slice(mobileVisibleCount);

  const hasMoreMobileItems = moreMobileItems.length > 0;
  const isMoreActive = moreMobileItems.some(
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

  const handleTabClick = (value: TValue) => {
    onChange(value);
    setIsMoreOpen(false);
  };

  return (
    <div className={css.tabs} role="tablist" aria-label={ariaLabel} ref={tabsRef}>
      {items.map((item, index) => {
        const isActive = item.value === activeValue;
        const isHiddenOnMobile = index >= mobileVisibleCount;

        return (
          <button
            className={clsx(
              isActive ? css.tabActive : css.tab,
              isHiddenOnMobile && css.tabDesktopOnly
            )}
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleTabClick(item.value)}
          >
            {item.label}
          </button>
        );
      })}

      {hasMoreMobileItems ? (
        <div className={css.moreWrap}>
          <button
            className={clsx(
              isMoreActive ? css.tabActive : css.tab,
              css.moreButton
            )}
            type="button"
            aria-label={mergedLabels.moreButton}
            aria-haspopup="menu"
            aria-expanded={isMoreOpen}
            aria-controls={moreMenuId}
            onClick={() => setIsMoreOpen((prev) => !prev)}
          >
            <span className={css.moreIcon} aria-hidden="true">
              ...
            </span>
          </button>

          {isMoreOpen ? (
            <div className={css.moreMenu} id={moreMenuId} role="menu">
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
    </div>
  );
}

export default Tabs;

export { Tabs };
