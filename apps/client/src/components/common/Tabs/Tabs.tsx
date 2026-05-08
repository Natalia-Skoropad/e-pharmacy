'use client';

import css from './Tabs.module.css';

//===================================================================

export type TabItem<TValue extends string = string> = {
  value: TValue;
  label: string;
};

type TabsProps<TValue extends string = string> = {
  items: TabItem<TValue>[];
  activeValue: TValue;
  ariaLabel: string;
  onChange: (value: TValue) => void;
};

//===================================================================

function Tabs<TValue extends string = string>({
  items,
  activeValue,
  ariaLabel,
  onChange,
}: TabsProps<TValue>) {
  return (
    <nav className={css.tabs} aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = item.value === activeValue;

        return (
          <button
            className={isActive ? css.tabActive : css.tab}
            key={item.value}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export default Tabs;
