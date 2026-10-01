'use client';

import {
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { Check, Palette, X } from 'lucide-react';

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
  '#334155',
  '#1E293B',
] as const;

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;

type HsvColor = Readonly<{
  h: number;
  s: number;
  v: number;
}>;

//===================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toHexChannel(value: number): string {
  return Math.round(clamp(value, 0, 255))
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
}

function hsvToHex({ h, s, v }: HsvColor): string {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s, 0, 100) / 100;
  const brightness = clamp(v, 0, 100) / 100;

  const chroma = brightness * saturation;
  const section = hue / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));

  let red = 0;
  let green = 0;
  let blue = 0;

  if (section < 1) {
    red = chroma;
    green = x;
  } else if (section < 2) {
    red = x;
    green = chroma;
  } else if (section < 3) {
    green = chroma;
    blue = x;
  } else if (section < 4) {
    green = x;
    blue = chroma;
  } else if (section < 5) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  const match = brightness - chroma;

  return `#${toHexChannel((red + match) * 255)}${toHexChannel(
    (green + match) * 255
  )}${toHexChannel((blue + match) * 255)}`;
}

function hexToHsv(value: string): HsvColor {
  const normalized = normalizeProductCategoryColor(value);
  const raw = normalized.slice(1);
  const red = Number.parseInt(raw.slice(0, 2), 16) / 255;
  const green = Number.parseInt(raw.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(raw.slice(4, 6), 16) / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;

  if (delta !== 0) {
    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  if (hue < 0) hue += 360;

  return {
    h: Math.round(hue),
    s: max === 0 ? 0 : Math.round((delta / max) * 100),
    v: Math.round(max * 100),
  };
}

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

  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [draftHsv, setDraftHsv] = useState<HsvColor>(() =>
    hexToHsv(selectedColor)
  );
  const [draftHex, setDraftHex] = useState(selectedColor);

  const describedBy =
    [hint ? `${id}-hint` : undefined, hasError ? `${id}-error` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  const updateDraftFromHsv = (nextHsv: HsvColor) => {
    const normalizedHsv = {
      h: clamp(Math.round(nextHsv.h), 0, 360),
      s: clamp(Math.round(nextHsv.s), 0, 100),
      v: clamp(Math.round(nextHsv.v), 0, 100),
    };

    setDraftHsv(normalizedHsv);
    setDraftHex(hsvToHex(normalizedHsv));
  };

  const openCustomPalette = () => {
    const nextHsv = hexToHsv(selectedColor);
    setDraftHsv(nextHsv);
    setDraftHex(selectedColor);
    setIsCustomOpen(true);
  };

  const closeCustomPalette = () => {
    setIsCustomOpen(false);
  };

  const applyCustomColor = () => {
    if (!HEX_COLOR_PATTERN.test(draftHex)) return;

    onChange(normalizeProductCategoryColor(draftHex));
    setIsCustomOpen(false);
  };

  const updatePlaneFromPointer = (
    event: PointerEvent<HTMLDivElement>
  ): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    const saturation = ((event.clientX - rect.left) / rect.width) * 100;
    const brightness = 100 - ((event.clientY - rect.top) / rect.height) * 100;

    updateDraftFromHsv({
      ...draftHsv,
      s: clamp(saturation, 0, 100),
      v: clamp(brightness, 0, 100),
    });
  };

  const handlePlanePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePlaneFromPointer(event);
  };

  const handlePlanePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    updatePlaneFromPointer(event);
  };

  const handlePlaneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 10 : 2;
    let nextHsv: HsvColor | null = null;

    if (event.key === 'ArrowLeft') {
      nextHsv = { ...draftHsv, s: draftHsv.s - step };
    } else if (event.key === 'ArrowRight') {
      nextHsv = { ...draftHsv, s: draftHsv.s + step };
    } else if (event.key === 'ArrowUp') {
      nextHsv = { ...draftHsv, v: draftHsv.v + step };
    } else if (event.key === 'ArrowDown') {
      nextHsv = { ...draftHsv, v: draftHsv.v - step };
    }

    if (!nextHsv) return;

    event.preventDefault();
    updateDraftFromHsv(nextHsv);
  };

  const customPaletteStyle = {
    '--custom-picker-hue': `hsl(${draftHsv.h} 100% 50%)`,
  } as CSSProperties;

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
        <input type="hidden" name={name} value={selectedColor} />

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
                onClick={() => {
                  onChange(normalizedPreset);
                  setIsCustomOpen(false);
                }}
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

          <button
            className={css.moreColorsButton}
            type="button"
            disabled={disabled}
            aria-expanded={isCustomOpen}
            aria-controls={`${id}-custom-palette`}
            onClick={isCustomOpen ? closeCustomPalette : openCustomPalette}
          >
            <Palette size={17} aria-hidden="true" />
            <span>More colors</span>
          </button>
        </div>

        {isCustomOpen ? (
          <div
            className={css.customPalette}
            id={`${id}-custom-palette`}
            role="dialog"
            aria-label="Choose a custom color"
            style={customPaletteStyle}
          >
            <div className={css.customPaletteHeader}>
              <span className={css.customPaletteTitle}>Custom color</span>

              <button
                className={css.customPaletteClose}
                type="button"
                aria-label="Close custom color picker"
                onClick={closeCustomPalette}
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <div
              className={css.colorField}
              role="group"
              tabIndex={0}
              aria-label={`Saturation ${draftHsv.s}%, brightness ${draftHsv.v}%`}
              onPointerDown={handlePlanePointerDown}
              onPointerMove={handlePlanePointerMove}
              onKeyDown={handlePlaneKeyDown}
            >
              <span
                className={css.colorFieldPointer}
                style={{
                  left: `${draftHsv.s}%`,
                  top: `${100 - draftHsv.v}%`,
                  backgroundColor: draftHex,
                }}
                aria-hidden="true"
              />
            </div>

            <label className={css.rangeField} htmlFor={`${id}-hue`}>
              <span>Hue</span>
              <span>{draftHsv.h}°</span>
            </label>
            <input
              className={clsx(css.rangeInput, css.hueRange)}
              id={`${id}-hue`}
              type="range"
              min="0"
              max="360"
              value={draftHsv.h}
              onChange={(event) =>
                updateDraftFromHsv({
                  ...draftHsv,
                  h: Number(event.target.value),
                })
              }
            />

            <div className={css.compactRanges}>
              <label className={css.compactRange} htmlFor={`${id}-saturation`}>
                <span>Saturation</span>
                <input
                  className={css.rangeInput}
                  id={`${id}-saturation`}
                  type="range"
                  min="0"
                  max="100"
                  value={draftHsv.s}
                  onChange={(event) =>
                    updateDraftFromHsv({
                      ...draftHsv,
                      s: Number(event.target.value),
                    })
                  }
                />
                <span>{draftHsv.s}%</span>
              </label>

              <label className={css.compactRange} htmlFor={`${id}-brightness`}>
                <span>Brightness</span>
                <input
                  className={css.rangeInput}
                  id={`${id}-brightness`}
                  type="range"
                  min="0"
                  max="100"
                  value={draftHsv.v}
                  onChange={(event) =>
                    updateDraftFromHsv({
                      ...draftHsv,
                      v: Number(event.target.value),
                    })
                  }
                />
                <span>{draftHsv.v}%</span>
              </label>
            </div>

            <div className={css.hexRow}>
              <span
                className={css.customPreview}
                style={{ backgroundColor: hsvToHex(draftHsv) }}
                aria-hidden="true"
              />

              <label className={css.hexField} htmlFor={`${id}-hex`}>
                <span>HEX</span>
                <input
                  id={`${id}-hex`}
                  type="text"
                  value={draftHex}
                  maxLength={7}
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={!HEX_COLOR_PATTERN.test(draftHex) || undefined}
                  onChange={(event) => {
                    const nextValue = event.target.value.toUpperCase();
                    setDraftHex(nextValue);

                    if (HEX_COLOR_PATTERN.test(nextValue)) {
                      setDraftHsv(hexToHsv(nextValue));
                    }
                  }}
                />
              </label>
            </div>

            <div className={css.customPaletteActions}>
              <button
                className={css.customCancelButton}
                type="button"
                onClick={closeCustomPalette}
              >
                Cancel
              </button>

              <button
                className={css.customApplyButton}
                type="button"
                disabled={!HEX_COLOR_PATTERN.test(draftHex)}
                onClick={applyCustomColor}
              >
                Apply color
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </FormFieldLayout>
  );
}

export default ColorPicker;
