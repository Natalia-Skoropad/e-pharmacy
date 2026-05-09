import Link from 'next/link';
import clsx from 'clsx';

import css from './ResetFiltersButton.module.css';

//===================================================================

type ResetFiltersButtonProps = {
  href: string;
  className?: string;
  isVisible?: boolean;
};

//===================================================================

function ResetFiltersButton({
  href,
  className,
  isVisible = true,
}: ResetFiltersButtonProps) {
  return (
    <Link
      className={clsx(css.button, !isVisible && css.hidden, className)}
      href={href}
      aria-hidden={!isVisible}
      tabIndex={isVisible ? undefined : -1}
    >
      Reset filters
    </Link>
  );
}

export default ResetFiltersButton;
