'use client';

import clsx from 'clsx';

import {
  isProductCategoryColor,
  normalizeProductCategoryColor,
} from '@e-pharmacy/validation/reference-data';

import { FormFieldLayout } from '../FormFieldLayout';

import css from './ColorPicker.module.css';

//===================================================================

export type ColorPickerProps = Readonly<{
  id: string;
  name: string;
  value: string;
  label?: string;
  hint?: string;
  error?: string;
  isTouched?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
}>;

//===================================================================

function normalizeColorDraft(value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) return '';

  const withoutPrefix = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  const hex = withoutPrefix.replace(/[^0-9A-F]/g, '').slice(0, 6);

  return `#${hex}`;
}

//===================================================================

export function ColorPicker({
  id,
  name,
  value,
  label = 'Color',
  hint = 'Choose a category color or enter a HEX value.',
  error,
  isTouched,
  required = true,
  disabled = false,
  className,
  onChange,
}: ColorPickerProps) {
  const hasError = Boolean(isTouched && error);
  const colorInputValue = isProductCategoryColor(value)
    ? normalizeProductCategoryColor(value)
    : '#64748B';

  const describedBy =
    [hint ? `${id}-hint` : undefined, hasError ? `${id}-error` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <FormFieldLayout
      id={id}
      label={label}
      hint={hint}
      error={error}
      isTouched={isTouched}
      required={required}
      className={className}
    >
      <div
        className={clsx(
          css.control,
          hasError && css.controlError,
          disabled && css.controlDisabled
        )}
      >
        <label className={css.swatchWrap} htmlFor={`${id}-native`}>
          <span className="visually-hidden">Choose {label.toLowerCase()}</span>
          <span
            className={css.swatch}
            style={{ backgroundColor: colorInputValue }}
            aria-hidden="true"
          />
          <input
            id={`${id}-native`}
            className={css.nativeInput}
            type="color"
            value={colorInputValue}
            disabled={disabled}
            aria-describedby={describedBy}
            onChange={(event) =>
              onChange(normalizeProductCategoryColor(event.target.value))
            }
          />
        </label>

        <input
          id={id}
          className={css.textInput}
          name={name}
          type="text"
          inputMode="text"
          autoComplete="off"
          value={value}
          placeholder="#3B82F6"
          maxLength={7}
          required={required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          onChange={(event) =>
            onChange(normalizeColorDraft(event.target.value))
          }
        />
      </div>
    </FormFieldLayout>
  );
}

export default ColorPicker;
