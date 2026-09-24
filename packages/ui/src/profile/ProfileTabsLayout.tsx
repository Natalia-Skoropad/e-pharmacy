'use client';

import type { ReactNode } from 'react';

import { TabPanel, Tabs, type TabItem } from '../navigation/Tabs/Tabs';

import css from './Profile.module.css';

//===================================================================

export type ProfileTabsLayoutProps<TValue extends string = string> = Readonly<{
  idBase: string;
  items: TabItem<TValue>[];
  activeValue: TValue;
  ariaLabel: string;
  sidebarAriaLabel?: string;
  sidebar: ReactNode;
  children: ReactNode;
  mobileVisibleCount?: number;
  tabletVisibleCount?: number;
  onChange: (value: TValue) => void;
}>;

//===================================================================

export function ProfileTabsLayout<TValue extends string = string>({
  idBase,
  items,
  activeValue,
  ariaLabel,
  sidebarAriaLabel = 'Profile summary',
  sidebar,
  children,
  mobileVisibleCount = 1,
  tabletVisibleCount = 3,
  onChange,
}: ProfileTabsLayoutProps<TValue>) {
  return (
    <div className={css.tabsLayout}>
      <aside className={css.tabsSidebar} aria-label={sidebarAriaLabel}>
        {sidebar}
      </aside>

      <div className={css.tabsContent}>
        <Tabs
          idBase={idBase}
          items={items}
          activeValue={activeValue}
          ariaLabel={ariaLabel}
          mobileVisibleCount={mobileVisibleCount}
          tabletVisibleCount={tabletVisibleCount}
          onChange={onChange}
        />

        {children}
      </div>
    </div>
  );
}

//===================================================================

export type ProfileTabPanelProps<TValue extends string = string> = Readonly<{
  idBase: string;
  value: TValue;
  activeValue: TValue;
  children: ReactNode;
}>;

//===================================================================

export function ProfileTabPanel<TValue extends string = string>({
  idBase,
  value,
  activeValue,
  children,
}: ProfileTabPanelProps<TValue>) {
  return (
    <TabPanel
      idBase={idBase}
      value={value}
      activeValue={activeValue}
      className={css.tabPanel}
    >
      {children}
    </TabPanel>
  );
}
