'use client';

import { useId } from 'react';

import { SelectField, type SelectOption } from '../SelectField';

//===================================================================

export const DEFAULT_ROWS_PER_PAGE_OPTIONS = [20, 50, 100] as const;
export type RowsPerPageValue = (typeof DEFAULT_ROWS_PER_PAGE_OPTIONS)[number];

//===================================================================

export type RowsPerPageSelectProps<TValue extends number = RowsPerPageValue> =
  Readonly<{
    id?: string;
    label?: string;
    value: TValue;
    options?: readonly TValue[];
    disabled?: boolean;
    onChange: (value: TValue) => void;
  }>;

//===================================================================

function RowsPerPageSelect<TValue extends number = RowsPerPageValue>({
  id,
  label = 'Rows per page',
  value,
  options = DEFAULT_ROWS_PER_PAGE_OPTIONS as unknown as readonly TValue[],
  disabled = false,
  onChange,
}: RowsPerPageSelectProps<TValue>) {
  const generatedId = useId();

  const selectOptions: Array<SelectOption<string>> = options.map((option) => ({
    value: String(option),
    label: String(option),
  }));

  const handleChange = (nextValue: string) => {
    const parsedValue = Number(nextValue);
    const matchedValue = options.find((option) => option === parsedValue);

    if (matchedValue !== undefined) onChange(matchedValue);
  };

  return (
    <SelectField
      id={id ?? `rows-per-page-${generatedId}`}
      label={label}
      value={String(value)}
      options={selectOptions}
      disabled={disabled}
      onChange={handleChange}
    />
  );
}

export default RowsPerPageSelect;
export { RowsPerPageSelect };
