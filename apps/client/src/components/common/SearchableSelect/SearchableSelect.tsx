'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import clsx from 'clsx';

import css from './SearchableSelect.module.css';

//===================================================================

export type SearchableSelectOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

type SearchableSelectProps<TValue extends string = string> = {
  id?: string;
  label: string;
  value: TValue;
  options: SearchableSelectOption<TValue>[];
  placeholder?: string;
  emptyMessage?: string;
  isActive?: boolean;
  onChange: (value: TValue) => void;
};

//===================================================================

function SearchableSelect<TValue extends string = string>({
  id,
  label,
  value,
  options,
  placeholder = 'Search option',
  emptyMessage = 'No options found',
  isActive = false,
  onChange,
}: SearchableSelectProps<TValue>) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = options.find((option) => option.value === value);
  const inputValue = isOpen ? query : selectedOption?.label ?? '';

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery)
    );
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const openSelect = () => {
    setIsOpen(true);
    setQuery('');
  };

  const handleSelect = (nextValue: TValue) => {
    onChange(nextValue);
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const handleInputChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && filteredOptions[0]) {
      event.preventDefault();
      handleSelect(filteredOptions[0].value);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div className={css.field} ref={rootRef}>
      <label className={css.label} htmlFor={inputId}>
        {label}
      </label>

      <div className={css.selectRoot}>
        <div
          className={clsx(
            css.combobox,
            isOpen && css.comboboxOpen,
            isActive && css.comboboxActive
          )}
        >
          <Search className={css.searchIcon} size={18} aria-hidden="true" />

          <input
            id={inputId}
            ref={inputRef}
            className={css.input}
            type="search"
            role="combobox"
            value={inputValue}
            placeholder={placeholder}
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-haspopup="listbox"
            onFocus={openSelect}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            className={css.toggleButton}
            type="button"
            aria-label={isOpen ? 'Close options' : 'Open options'}
            aria-expanded={isOpen}
            aria-controls={listboxId}
            onClick={() => {
              setIsOpen((current) => !current);
              inputRef.current?.focus();
            }}
          >
            <ChevronDown
              className={clsx(css.chevron, isOpen && css.chevronOpen)}
              size={18}
              aria-hidden="true"
            />
          </button>
        </div>

        {isOpen ? (
          <ul
            className={css.options}
            id={listboxId}
            role="listbox"
            aria-label={label}
          >
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <li
                    className={clsx(
                      css.option,
                      isSelected && css.optionSelected
                    )}
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span>{option.label}</span>

                    {isSelected ? (
                      <Check className={css.checkIcon} size={16} aria-hidden />
                    ) : null}
                  </li>
                );
              })
            ) : (
              <li className={css.empty}>{emptyMessage}</li>
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export default SearchableSelect;
