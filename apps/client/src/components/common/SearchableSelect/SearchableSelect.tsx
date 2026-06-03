'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import clsx from 'clsx';

import {
  isListboxOpenKey,
  useListboxNavigation,
} from '@e-pharmacy/hooks';

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
  maxLength?: number;
  sanitizeQuery?: (value: string) => string;
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
  maxLength = 80,
  sanitizeQuery,
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
  const inputValue = isOpen ? query : (selectedOption?.label ?? '');

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery)
    );
  }, [options, query]);

  const {
    activeIndex,
    moveActiveIndex,
    resetActiveIndex,
    setActiveIndex,
  } = useListboxNavigation(filteredOptions.length);
  const activeOption = filteredOptions[activeIndex];
  const activeOptionId = activeOption
    ? `${listboxId}-option-${activeOption.value}`
    : undefined;

  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isOpen]);

  const closeSelect = () => {
    setIsOpen(false);
    setQuery('');
  };

  const openSelect = () => {
    setIsOpen(true);
    setQuery('');
    resetActiveIndex(0);
  };

  const handleSelect = (nextValue: TValue) => {
    onChange(nextValue);
    closeSelect();
    inputRef.current?.blur();
  };

  const handleInputChange = (nextQuery: string) => {
    const sanitizedQuery = sanitizeQuery ? sanitizeQuery(nextQuery) : nextQuery;

    setQuery(sanitizedQuery.slice(0, maxLength));
    resetActiveIndex(0);
    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isListboxOpenKey(event.key)) {
      event.preventDefault();

      if (!isOpen) {
        setIsOpen(true);
        return;
      }

      moveActiveIndex(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();

      if (activeOption) {
        handleSelect(activeOption.value);
      }

      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeSelect();
      inputRef.current?.blur();
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
            type="text"
            role="combobox"
            value={inputValue}
            placeholder={placeholder}
            autoComplete="off"
            maxLength={maxLength}
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-haspopup="listbox"
            aria-activedescendant={isOpen ? activeOptionId : undefined}
            onFocus={openSelect}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            className={css.toggleButton}
            type="button"
            aria-label={isOpen ? 'Close options' : 'Open options'}
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            onClick={() => {
              if (isOpen) {
                closeSelect();
              } else {
                openSelect();
              }

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
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isOptionActive = index === activeIndex;

                return (
                  <li
                    className={clsx(
                      css.option,
                      isOptionActive && css.optionActive,
                      isSelected && css.optionSelected
                    )}
                    id={`${listboxId}-option-${option.value}`}
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
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
