'use client';

import { Check, Palette } from 'lucide-react';
import clsx from 'clsx';

import {
  isProductCategoryColor,
  normalizeProductCategoryColor,
} from '@e-pharmacy/validation/reference-data';

import { FormFieldLayout } from '../FormFieldLayout';

import css from './ColorPicker.module.css';

//===================================================================

const COLOR_PRESETS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#84CC16',
  '#22C55E',
  '#10B981',
  '#14B8A6',
  '#06B6D4',
  '#0EA5E9',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#A855F7',
  '#D946EF',
  '#EC4899',
  '#F43F5E',
  '#78716C',
  '#64748B',
  '#475569',
] as const;

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

export function ColorPicker({
  id,
  name,
  value,
  label = 'Color',
  hint = 'Choose a color from the palette or open More colors for a custom shade.',
  error,
  isTouched,
  required = true,
  disabled = false,
  className,
  onChange,
}: ColorPickerProps) {
  const hasError = Boolean(isTouched && error);
  const selectedColor = isProductCategoryColor(value)
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
          css.picker,
          hasError && css.pickerError,
          disabled && css.pickerDisabled
        )}
        aria-describedby={describedBy}
      >
        <div
          className={css.palette}
          role="radiogroup"
          aria-label={`${label} palette`}
        >
          {COLOR_PRESETS.map((preset) => {
            const normalizedPreset = normalizeProductCategoryColor(preset);
            const isSelected = normalizedPreset === selectedColor;

            return (
              <button
                className={clsx(css.swatchButton, isSelected && css.selected)}
                key={preset}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`Select color ${preset}`}
                disabled={disabled}
                onClick={() => onChange(normalizedPreset)}
              >
                <span
                  className={css.swatch}
                  style={{ backgroundColor: normalizedPreset }}
                  aria-hidden="true"
                >
                  {isSelected ? <Check size={15} strokeWidth={3} /> : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className={css.customRow}>
          <span className={css.selectedPreview} aria-hidden="true">
            <span
              className={css.selectedSwatch}
              style={{ backgroundColor: selectedColor }}
            />
            Selected color
          </span>

          <label
            className={clsx(
              css.moreColorsButton,
              disabled && css.moreColorsDisabled
            )}
            htmlFor={`${id}-native`}
          >
            <Palette size={17} aria-hidden="true" />
            <span>More colors</span>
            <input
              id={`${id}-native`}
              className={css.nativeInput}
              name={name}
              type="color"
              value={selectedColor}
              required={required}
              disabled={disabled}
              aria-invalid={hasError || undefined}
              aria-describedby={describedBy}
              onChange={(event) =>
                onChange(normalizeProductCategoryColor(event.target.value))
              }
            />
          </label>
        </div>
      </div>
    </FormFieldLayout>
  );
}

export default ColorPicker;
