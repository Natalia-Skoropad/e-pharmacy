import type { ReactNode } from 'react';
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
  onClick?: () => void;
};

//===================================================================

function ResetFiltersButton({
  href,
  children,
  label = 'Reset filters',
  className,
  isVisible = true,
  onClick,
}: ResetFiltersButtonProps) {
  return (
    <Link
      className={clsx(css.button, !isVisible && css.hidden, className)}
      href={href}
      aria-hidden={!isVisible}
      tabIndex={isVisible ? undefined : -1}
      onClick={onClick}
    >
      {children ?? label}
    </Link>
  );
}

export default ResetFiltersButton;

export { ResetFiltersButton };
