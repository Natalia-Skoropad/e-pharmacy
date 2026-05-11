import clsx from 'clsx';

import css from './RadioOption.module.css';

//===================================================================

type RadioOptionProps<TValue extends string> = {
  name: string;
  value: TValue;
  checked: boolean;
  label: string;
  onChange: (value: TValue) => void;
  className?: string;
};

//===================================================================

function RadioOption<TValue extends string>({
  name,
  value,
  checked,
  label,
  onChange,
  className,
}: RadioOptionProps<TValue>) {
  return (
    <label className={clsx(css.option, className)}>
      <input
        className={css.input}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
      />
      <span className={css.control} aria-hidden="true" />
      <span className={css.label}>{label}</span>
    </label>
  );
}

export default RadioOption;
