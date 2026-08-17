import type { MouseEvent, ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

import css from './ResetFiltersButton.module.css';

//===================================================================

export type ResetFiltersButtonProps = {
  href?: string;
  children?: ReactNode;
  label?: ReactNode;
  className?: string;
  isVisible?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

//===================================================================

function ResetFiltersButton({
  href,
  children,
  label = 'Reset filters',
  className,
  isVisible = true,
  disabled = false,
  onClick,
}: ResetFiltersButtonProps) {
  const commonClassName = clsx(css.button, !isVisible && css.hidden, className);
  const content = children ?? label;

  if (!href) {
    return (
      <button
        className={commonClassName}
        type="button"
        aria-hidden={!isVisible}
        disabled={disabled}
        tabIndex={isVisible && !disabled ? undefined : -1}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    onClick?.();
  };

  return (
    <Link
      className={commonClassName}
      href={href}
      aria-hidden={!isVisible}
      aria-disabled={disabled || undefined}
      tabIndex={isVisible && !disabled ? undefined : -1}
      onClick={handleClick}
    >
      {content}
    </Link>
  );
}

export default ResetFiltersButton;
export { ResetFiltersButton };
