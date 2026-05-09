'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

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

  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (nextValue: TValue) => {
    onChange(nextValue);
    setIsOpen(false);
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
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <li
                  className={clsx(css.option, isSelected && css.optionSelected)}
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
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export default SelectField;
