import type { ReactNode } from 'react';

import css from './ReadonlyField.module.css';

//===================================================================

type ReadonlyFieldProps = Readonly<{
  label: string;
  value: ReactNode;
}>;

//===================================================================

export function ReadonlyField({ label, value }: ReadonlyFieldProps) {
  return (
    <div className={css.field}>
      <span className={css.label}>{label}</span>
      <div className={css.value}>{value || '—'}</div>
    </div>
  );
}
