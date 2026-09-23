'use client';

import Link from 'next/link';

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import clsx from 'clsx';

import { useOutsidePointerDown } from '@e-pharmacy/hooks/dom';

import css from './UserDropdown.module.css';

//===================================================================

export type UserDropdownLinkItem = Readonly<{
  type: 'link';
  label: string;
  href: string;
  icon?: ReactNode;
  external?: boolean;
}>;

export type UserDropdownStatusItem = Readonly<{
  type: 'status';
  label: string;
  icon?: ReactNode;
  ariaBusy?: boolean;
}>;

export type UserDropdownActionItem = Readonly<{
  type: 'action';
  label: string;
  pendingLabel?: string;
  icon?: ReactNode;
  onSelect: () => void | Promise<void>;
  disabled?: boolean;
  isPending?: boolean;
  destructive?: boolean;
}>;

export type UserDropdownSeparatorItem = Readonly<{
  type: 'separator';
}>;

export type UserDropdownItem =
  | UserDropdownLinkItem
  | UserDropdownStatusItem
  | UserDropdownActionItem
  | UserDropdownSeparatorItem;

//===================================================================

type UserDropdownLinkRenderProps = Readonly<{
  item: UserDropdownLinkItem;
  href: string;
  className: string;
  children: ReactNode;
  onClick: () => void;
}>;

export type UserDropdownProps = Readonly<{
  items: readonly UserDropdownItem[];
  trigger: ReactNode;
  triggerLabel?: string;
  id?: string;
  className?: string;
  triggerClassName?: string;
  renderLink?: (props: UserDropdownLinkRenderProps) => ReactNode;
}>;

//===================================================================

function UserDropdown({
  items,
  trigger,
  triggerLabel,
  id,
  className,
  triggerClassName,
  renderLink,
}: UserDropdownProps) {
  const generatedId = useId();
  const menuId = id ?? `user-dropdown-${generatedId}`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  useOutsidePointerDown({
    refs: [rootRef],
    enabled: isOpen,
    onOutside: close,
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      setIsOpen(false);
      triggerRef.current?.focus();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleActionSelect = async (item: UserDropdownActionItem) => {
    if (item.disabled || item.isPending) return;

    try {
      await item.onSelect();
    } finally {
      close();
    }
  };

  return (
    <div className={clsx(css.root, className)} ref={rootRef}>
      <button
        ref={triggerRef}
        className={clsx(css.trigger, triggerClassName)}
        type="button"
        aria-label={triggerLabel}
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-haspopup="true"
        onClick={() => setIsOpen((value) => !value)}
      >
        {trigger}
      </button>

      {isOpen ? (
        <div className={css.menu} id={menuId}>
          {items.map((item, index) => {
            if (item.type === 'separator') {
              return (
                <span
                  className={css.divider}
                  aria-hidden="true"
                  key={`separator-${index}`}
                />
              );
            }

            const itemClassName = clsx(
              css.item,
              !item.icon && css.itemWithoutIcon
            );

            const content = (
              <>
                {item.icon ? (
                  <span className={css.icon} aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}
                <span>{item.label}</span>
              </>
            );

            if (item.type === 'status') {
              return (
                <span
                  className={clsx(itemClassName, css.disabledItem)}
                  aria-disabled="true"
                  aria-busy={item.ariaBusy || undefined}
                  key={`status-${index}-${item.label}`}
                >
                  {content}
                </span>
              );
            }

            if (item.type === 'action') {
              return (
                <button
                  className={clsx(
                    itemClassName,
                    item.destructive && css.destructiveItem
                  )}
                  type="button"
                  disabled={item.disabled || item.isPending}
                  aria-busy={item.isPending || undefined}
                  onClick={() => void handleActionSelect(item)}
                  key={`action-${index}-${item.label}`}
                >
                  {item.icon ? (
                    <span className={css.icon} aria-hidden="true">
                      {item.icon}
                    </span>
                  ) : null}
                  <span>
                    {item.isPending && item.pendingLabel
                      ? item.pendingLabel
                      : item.label}
                  </span>
                </button>
              );
            }

            if (renderLink) {
              return (
                <Fragment key={`link-${index}-${item.href}`}>
                  {renderLink({
                    item,
                    href: item.href,
                    className: itemClassName,
                    children: content,
                    onClick: close,
                  })}
                </Fragment>
              );
            }

            if (item.external) {
              return (
                <a
                  className={itemClassName}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={close}
                  key={`link-${index}-${item.href}`}
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                className={itemClassName}
                href={item.href}
                onClick={close}
                key={`link-${index}-${item.href}`}
              >
                {content}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default UserDropdown;
export { UserDropdown };
