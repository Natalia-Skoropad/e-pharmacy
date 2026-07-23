import clsx from 'clsx';

import css from './LoadingSpinner.module.css';

//===================================================================

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
};

//===================================================================

function LoadingSpinner({
  label = 'Loading...',
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={clsx(css.wrap, className)} role="status" aria-live="polite">
      <span className={css.spinner} aria-hidden="true" />
      <span className={css.label}>{label}</span>
    </div>
  );
}

export default LoadingSpinner;
export { LoadingSpinner };
