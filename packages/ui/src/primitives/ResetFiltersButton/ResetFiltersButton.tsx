import type { MouseEvent, ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

import css from './ResetFiltersButton.module.css';

//===================================================================

export type ResetFiltersButtonProps = {
  href: string;
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
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    onClick?.();
  };

  return (
    <Link
      className={clsx(css.button, !isVisible && css.hidden, className)}
      href={href}
      aria-hidden={!isVisible}
      aria-disabled={disabled || undefined}
      tabIndex={isVisible && !disabled ? undefined : -1}
      onClick={handleClick}
    >
      {children ?? label}
    </Link>
  );
}

export default ResetFiltersButton;
export { ResetFiltersButton };
