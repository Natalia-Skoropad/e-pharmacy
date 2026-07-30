'use client';

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import clsx from 'clsx';
import { Check, ChevronDown, LoaderCircle, Search } from 'lucide-react';

import { useOutsidePointerDown } from '@e-pharmacy/hooks/dom';

import { useListboxNavigation } from '../../internal/listbox/useListboxNavigation';

import css from './SearchableSelect.module.css';

//===================================================================

export type SearchableSelectOption<TValue extends string = string> = Readonly<{
  value: TValue;
  label: string;
  leading?: ReactNode;
  disabled?: boolean;
}>;

export type SearchableSelectProps<TValue extends string = string> = Readonly<{
  id?: string;
  label: string;
  labelAccessory?: ReactNode;
  value: TValue;
  options: readonly SearchableSelectOption<TValue>[];
  placeholder?: string;
  emptyMessage?: string;
  isActive?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  error?: string;
  describedBy?: string;
  maxLength?: number;
  sanitizeQuery?: (value: string) => string;
  onChange: (value: TValue) => void;
}>;

//===================================================================

function SearchableSelect<TValue extends string = string>({
  id,
  label,
  labelAccessory,
  value,
  options,
  placeholder = 'Search option',
  emptyMessage = 'No options found',
  isActive = false,
  isLoading = false,
  disabled = false,
  error,
  describedBy,
  maxLength = 80,
  sanitizeQuery,
  onChange,
}: SearchableSelectProps<TValue>) {
  const generatedId = useId();
  const inputId = id ?? `searchable-select-${generatedId}`;
  const listboxId = `${inputId}-listbox`;
  const errorId = error ? `${inputId}-error` : undefined;

  const ariaDescribedBy =
    [describedBy, errorId].filter(Boolean).join(' ') || undefined;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = options.find((option) => option.value === value);
  const inputValue = isOpen ? query : (selectedOption?.label ?? '');

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) =>
      option.label.toLocaleLowerCase().includes(normalizedQuery)
    );
  }, [options, query]);

  const isOptionDisabled = useCallback(
    (index: number) => Boolean(filteredOptions[index]?.disabled),
    [filteredOptions]
  );
  const {
    activeIndex,
    moveActiveIndex,
    moveToStart,
    moveToEnd,
    resetActiveIndex,
    setActiveIndex,
  } = useListboxNavigation(filteredOptions.length, 0, isOptionDisabled);
  const activeOption =
    activeIndex >= 0 ? filteredOptions[activeIndex] : undefined;

  const activeOptionId =
    isOpen && activeIndex >= 0
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  useOutsidePointerDown({
    refs: [rootRef],
    enabled: isOpen,
    onOutside: () => {
      setIsOpen(false);
      setQuery('');
    },
  });

  const closeSelect = () => {
    setIsOpen(false);
    setQuery('');
  };

  const openSelect = () => {
    if (disabled || isLoading) return;
    setIsOpen(true);
    setQuery('');
    resetActiveIndex(0);
  };

  const handleSelect = (option: SearchableSelectOption<TValue> | undefined) => {
    if (!option || option.disabled || disabled || isLoading) return;
    onChange(option.value);
    closeSelect();
    inputRef.current?.focus();
  };

  const handleInputChange = (nextQuery: string) => {
    if (disabled || isLoading) return;

    const sanitizedQuery = sanitizeQuery ? sanitizeQuery(nextQuery) : nextQuery;
    setQuery(sanitizedQuery.slice(0, maxLength));
    resetActiveIndex(0);
    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || isLoading) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) openSelect();
      else moveActiveIndex(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      if (!isOpen) return;
      event.preventDefault();
      if (event.key === 'Home') moveToStart();
      else moveToEnd();
      return;
    }

    if (event.key === 'Enter' && isOpen) {
      event.preventDefault();
      handleSelect(activeOption);
      return;
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      closeSelect();
    }
  };

  return (
    <div className={css.field} ref={rootRef}>
      <span className={css.labelRow}>
        <label className={css.label} htmlFor={inputId}>
          {label}
        </label>
        {labelAccessory}
      </span>

      <div className={css.selectRoot}>
        <div
          className={clsx(
            css.combobox,
            isOpen && css.comboboxOpen,
            isActive && css.comboboxActive,
            error && css.comboboxError,
            (disabled || isLoading) && css.comboboxDisabled
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
            disabled={disabled || isLoading}
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-haspopup="listbox"
            aria-activedescendant={activeOptionId}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={ariaDescribedBy}
            onFocus={openSelect}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            className={css.toggleButton}
            type="button"
            disabled={disabled || isLoading}
            aria-label={isOpen ? 'Close options' : 'Open options'}
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            onClick={() => {
              if (isOpen) closeSelect();
              else openSelect();
              inputRef.current?.focus();
            }}
          >
            {isLoading ? (
              <LoaderCircle
                className={css.spinner}
                size={18}
                aria-hidden="true"
              />
            ) : (
              <ChevronDown
                className={clsx(css.chevron, isOpen && css.chevronOpen)}
                size={18}
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        {error ? (
          <p className={css.error} id={errorId}>
            {error}
          </p>
        ) : null}

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
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    className={clsx(
                      css.option,
                      option.leading && css.optionWithLeading,
                      isOptionActive && css.optionActive,
                      isSelected && css.optionSelected,
                      option.disabled && css.optionDisabled
                    )}
                    id={`${listboxId}-option-${index}`}
                    key={`${option.value}-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    onMouseEnter={() => {
                      if (!option.disabled) setActiveIndex(index);
                    }}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option)}
                  >
                    {option.leading ? (
                      <span className={css.optionLeading}>
                        {option.leading}
                      </span>
                    ) : null}
                    <span className={css.optionLabel}>{option.label}</span>
                    {isSelected ? (
                      <Check
                        className={css.checkIcon}
                        size={16}
                        aria-hidden="true"
                      />
                    ) : null}
                  </li>
                );
              })
            ) : (
              <li className={css.empty} role="status">
                {emptyMessage}
              </li>
            )}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export default SearchableSelect;
export { SearchableSelect };
