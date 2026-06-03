import Link from 'next/link';
import clsx from 'clsx';

import css from './ResetFiltersButton.module.css';

//===================================================================

type ResetFiltersButtonProps = {
  href: string;
  className?: string;
  isVisible?: boolean;
  onClick?: () => void;
};

//===================================================================

function ResetFiltersButton({
  href,
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
      Reset filters
    </Link>
  );
}

export default ResetFiltersButton;
