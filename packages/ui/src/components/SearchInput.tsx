import type { InputHTMLAttributes } from 'react';

//=============================================================================

export type SearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  label?: string;
};

//=============================================================================

export function SearchInput({
  label = 'Search',
  id,
  className,
  ...props
}: SearchInputProps) {
  const inputId = id ?? 'search-input';

  return (
    <label className={className} htmlFor={inputId}>
      <span>{label}</span>
      <input id={inputId} type="search" {...props} />
    </label>
  );
}
