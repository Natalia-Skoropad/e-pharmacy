import type { InputHTMLAttributes, ReactNode } from 'react';

//=============================================================================

export type RadioOptionProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label: ReactNode;
};

//=============================================================================

export function RadioOption({ label, className, ...props }: RadioOptionProps) {
  return (
    <label className={className}>
      <input type="radio" {...props} />
      <span>{label}</span>
    </label>
  );
}
