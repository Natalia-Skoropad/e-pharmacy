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
  searchPlaceholder?: string;
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
  placeholder = 'Select option',
  searchPlaceholder = 'Search',
  emptyMessage = 'No options found',
  isActive = false,
  onChange,
}: SearchableSelectProps<TValue>) {
  const generatedId = useId();
  const buttonId = id ?? generatedId;
  const searchId = `${buttonId}-search`;
  const listboxId = `${buttonId}-listbox`;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = options.find((option) => option.value === value);

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
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);
    searchRef.current?.focus();

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (nextValue: TValue) => {
    onChange(nextValue);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className={css.field} ref={rootRef}>
      <span className={css.label} id={`${buttonId}-label`}>
        {label}
      </span>

      <div className={css.selectRoot}>
        <button
          id={buttonId}
          className={clsx(
            css.trigger,
            isOpen && css.triggerOpen,
            isActive && css.triggerActive
          )}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={`${buttonId}-label ${buttonId}`}
          aria-controls={listboxId}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className={css.triggerText}>
            {selectedOption?.label ?? placeholder}
          </span>

          <ChevronDown
            className={clsx(css.chevron, isOpen && css.chevronOpen)}
            size={18}
            aria-hidden="true"
          />
        </button>

        {isOpen ? (
          <div className={css.dropdown}>
            <label className={css.searchBox} htmlFor={searchId}>
              <Search className={css.searchIcon} size={16} aria-hidden="true" />
              <input
                id={searchId}
                ref={searchRef}
                className={css.searchInput}
                type="search"
                value={query}
                placeholder={searchPlaceholder}
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <ul
              className={css.options}
              id={listboxId}
              role="listbox"
              aria-labelledby={`${buttonId}-label`}
              tabIndex={-1}
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
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default SearchableSelect;
