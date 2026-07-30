'use client';

import clsx from 'clsx';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, LoaderCircle } from 'lucide-react';

import { useOutsidePointerDown } from '@e-pharmacy/hooks/dom';

import { useListboxNavigation } from '../../internal/listbox/useListboxNavigation';

import css from './SelectField.module.css';

//===============================================================

export type SelectOption<TValue extends string> = Readonly<{
  value: TValue;
  label: string;
  disabled?: boolean;
}>;

export type SelectFieldProps<TValue extends string> = Readonly<{
  id?: string;
  label: string;
  value: TValue;
  options: readonly SelectOption<TValue>[];
  placeholder?: string;
  hint?: string;
  required?: boolean;
  isActive?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  error?: string;
  describedBy?: string;
  onChange: (value: TValue) => void;
}>;

//===============================================================

const TYPEAHEAD_RESET_DELAY = 700;

//===============================================================

function SelectField<TValue extends string>({
  id,
  label,
  value,
  options,
  placeholder = 'Select option',
  hint,
  required = false,
  isActive = false,
  isLoading = false,
  disabled = false,
  error,
  describedBy,
  onChange,
}: SelectFieldProps<TValue>) {
  const generatedId = useId();
  const buttonId = id ?? `select-${generatedId}`;
  const listboxId = `${buttonId}-listbox`;
  const errorId = error ? `${buttonId}-error` : undefined;
  const hintId = hint ? `${buttonId}-hint` : undefined;

  const ariaDescribedBy =
    [describedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);
  const typeaheadRef = useRef('');
  const typeaheadTimerRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);
  const selectedIndex = options.findIndex((option) => option.value === value);

  const isOptionDisabled = useCallback(
    (index: number) => Boolean(options[index]?.disabled),
    [options]
  );

  const {
    activeIndex,
    moveActiveIndex,
    moveToStart,
    moveToEnd,
    resetActiveIndex,
    setActiveIndex,
  } = useListboxNavigation(
    options.length,
    Math.max(selectedIndex, 0),
    isOptionDisabled
  );
  const activeOption = activeIndex >= 0 ? options[activeIndex] : undefined;

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
    onOutside: () => setIsOpen(false),
  });

  useEffect(
    () => () => {
      if (typeaheadTimerRef.current !== null) {
        window.clearTimeout(typeaheadTimerRef.current);
      }
    },
    []
  );

  const openSelect = () => {
    if (disabled || isLoading) return;
    resetActiveIndex(Math.max(selectedIndex, 0));
    setIsOpen(true);
  };

  const handleSelect = (option: SelectOption<TValue> | undefined) => {
    if (!option || option.disabled || disabled || isLoading) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const handleTypeahead = (key: string) => {
    typeaheadRef.current += key.toLocaleLowerCase();

    if (typeaheadTimerRef.current !== null) {
      window.clearTimeout(typeaheadTimerRef.current);
    }

    typeaheadTimerRef.current = window.setTimeout(() => {
      typeaheadRef.current = '';
    }, TYPEAHEAD_RESET_DELAY);

    const matchIndex = options.findIndex(
      (option) =>
        !option.disabled &&
        option.label.toLocaleLowerCase().startsWith(typeaheadRef.current)
    );

    if (matchIndex >= 0) {
      setActiveIndex(matchIndex);
      if (!isOpen) setIsOpen(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) openSelect();
      else moveActiveIndex(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (!isOpen) setIsOpen(true);
      if (event.key === 'Home') moveToStart();
      else moveToEnd();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isOpen) openSelect();
      else handleSelect(activeOption);
      return;
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (event.key.length === 1 && /\S/.test(event.key)) {
      handleTypeahead(event.key);
    }
  };

  return (
    <div
      className={clsx(css.field, (hint || required) && css.formField)}
      ref={rootRef}
    >
      <span className={css.label} id={`${buttonId}-label`}>
        {label}
        {required ? (
          <span className={css.requiredMark} aria-hidden="true">
            *
          </span>
        ) : null}
      </span>

      {hint ? (
        <p className={css.hint} id={hintId}>
          {hint}
        </p>
      ) : null}

      <div className={css.selectRoot}>
        <button
          id={buttonId}
          className={clsx(
            css.trigger,
            isOpen && css.triggerOpen,
            isActive && css.triggerActive,
            error && css.triggerError
          )}
          type="button"
          role="combobox"
          disabled={disabled || isLoading}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={`${buttonId}-label ${buttonId}`}
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={activeOptionId}
          aria-required={required || undefined}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={ariaDescribedBy}
          onClick={() => (isOpen ? setIsOpen(false) : openSelect())}
          onKeyDown={handleKeyDown}
        >
          <span
            className={clsx(
              css.triggerText,
              !selectedOption && css.placeholder
            )}
          >
            {selectedOption?.label ?? placeholder}
          </span>

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
            aria-labelledby={`${buttonId}-label`}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isOptionActive = index === activeIndex;

              return (
                <li
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  className={clsx(
                    css.option,
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
                  <span>{option.label}</span>
                  {isSelected ? (
                    <Check
                      className={css.checkIcon}
                      size={16}
                      aria-hidden="true"
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export default SelectField;
export { SelectField };
