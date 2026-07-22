import { SelectField, type SelectOption } from '../SelectField';

//===================================================================

export type RowsPerPageValue = 20 | 50 | 100;

//===================================================================

export type RowsPerPageSelectProps = Readonly<{
  id?: string;
  label?: string;
  value: RowsPerPageValue;
  options?: readonly RowsPerPageValue[];
  disabled?: boolean;
  onChange: (value: RowsPerPageValue) => void;
}>;

//===================================================================

const DEFAULT_ROWS_PER_PAGE_OPTIONS: readonly RowsPerPageValue[] = [20, 50, 100];

//===================================================================

function isRowsPerPageValue(value: number): value is RowsPerPageValue {
  return DEFAULT_ROWS_PER_PAGE_OPTIONS.includes(value as RowsPerPageValue);
}

//===================================================================

function RowsPerPageSelect({
  id = 'rows-per-page',
  label = 'Rows per page',
  value,
  options = DEFAULT_ROWS_PER_PAGE_OPTIONS,
  disabled = false,
  onChange,
}: RowsPerPageSelectProps) {
  const selectOptions: Array<SelectOption<string>> = options.map((option) => ({
    value: String(option),
    label: String(option),
  }));

  const handleChange = (nextValue: string) => {
    const parsedValue = Number(nextValue);

    if (isRowsPerPageValue(parsedValue)) {
      onChange(parsedValue);
    }
  };

  return (
    <SelectField
      id={id}
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
