'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

import {
  isListboxOpenKey,
  isListboxSelectKey,
} from '../helpers/listbox-keyboard';

import { useListboxNavigation } from '../helpers/useListboxNavigation';

import css from './SelectField.module.css';

//===================================================================

type SelectOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type SelectFieldProps<TValue extends string> = {
  id?: string;
  label: string;
  value: TValue;
  options: SelectOption<TValue>[];
  isActive?: boolean;
  onChange: (value: TValue) => void;
};

//===================================================================

function SelectField<TValue extends string>({
  id,
  label,
  value,
  options,
  isActive = false,
  onChange,
}: SelectFieldProps<TValue>) {
  const generatedId = useId();
  const buttonId = id ?? generatedId;
  const listboxId = `${buttonId}-listbox`;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);
  const selectedIndex = useMemo(
    () =>
      Math.max(
        0,
        options.findIndex((option) => option.value === value)
      ),
    [options, value]
  );
  const { activeIndex, moveActiveIndex, resetActiveIndex, setActiveIndex } =
    useListboxNavigation(options.length, selectedIndex);
  const activeOption = options[activeIndex];

  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, [isOpen]);

  const openSelect = () => {
    resetActiveIndex(selectedIndex);
    setIsOpen(true);
  };

  const handleSelect = (nextValue: TValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (isListboxOpenKey(event.key)) {
      event.preventDefault();

      if (!isOpen) {
        openSelect();
        return;
      }

      moveActiveIndex(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (isListboxSelectKey(event.key)) {
      event.preventDefault();

      if (!isOpen) {
        openSelect();
        return;
      }

      if (activeOption) {
        handleSelect(activeOption.value);
      }

      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
    }
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
          aria-controls={isOpen ? listboxId : undefined}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              return;
            }

            openSelect();
          }}
          onKeyDown={handleKeyDown}
        >
          <span className={css.triggerText}>{selectedOption?.label}</span>

          <ChevronDown
            className={clsx(css.chevron, isOpen && css.chevronOpen)}
            size={18}
            aria-hidden="true"
          />
        </button>

        {isOpen ? (
          <ul
            className={css.options}
            id={listboxId}
            role="listbox"
            aria-labelledby={`${buttonId}-label`}
            tabIndex={-1}
          >
            {options.map((option, index) => {
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
                  onClick={() => handleSelect(option.value)}
                >
                  <span>{option.label}</span>

                  {isSelected ? (
                    <Check className={css.checkIcon} size={16} aria-hidden />
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
