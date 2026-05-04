import type { ReactNode } from 'react';

import css from './VisuallyHidden.module.css';

type VisuallyHiddenProps = {
  children: ReactNode;
};

function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <span className={css.visuallyHidden}>{children}</span>;
}

export default VisuallyHidden;
