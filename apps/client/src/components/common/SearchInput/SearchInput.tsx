import { Search, X } from 'lucide-react';
import clsx from 'clsx';

import css from './SearchInput.module.css';

//===================================================================

type SearchInputProps = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  isActive?: boolean;
  onChange: (value: string) => void;
};

//===================================================================

function SearchInput({
  id,
  label,
  value,
  placeholder,
  isActive = false,
  onChange,
}: SearchInputProps) {
  return (
    <label className={css.field} htmlFor={id}>
      <span className={css.label}>{label}</span>

      <span className={clsx(css.inputWrap, isActive && css.inputWrapActive)}>
        <Search className={css.icon} size={18} aria-hidden="true" />

        <input
          id={id}
          className={css.input}
          type="search"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
        />

        {value ? (
          <button
            className={css.clearButton}
            type="button"
            onClick={() => onChange('')}
            aria-label={`Clear ${label.toLowerCase()}`}
          >
            <X size={16} aria-hidden="true" />
          </button>
        ) : null}
      </span>
    </label>
  );
}

export default SearchInput;
