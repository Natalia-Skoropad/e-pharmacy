'use client';

import { useId, useRef, useState, type FormEvent } from 'react';

import { ColorPicker, NameInput } from '@e-pharmacy/ui/forms';

import { ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';
import { Button, CloseIconButton } from '@e-pharmacy/ui/primitives';

import {
  PRODUCT_CATEGORY_COLOR_MESSAGE,
  buildReferenceDataNameError,
  isProductCategoryColor,
  normalizeProductCategoryColor,
} from '@e-pharmacy/validation/reference-data';

import type {
  SettingsDictionaryFormValues,
  SettingsDictionaryItem,
} from './settings-dictionary.types';

import css from './SettingsDictionary.module.css';

//===================================================================

type SettingsDictionaryFormModalProps<TItem extends SettingsDictionaryItem> =
  Readonly<{
    mode: 'create' | 'edit';
    item?: TItem;
    singularLabel: string;
    defaultColor?: string;
    currentColor?: string;
    nameDisabled?: boolean;
    isSubmitting: boolean;
    submitError?: string | null;
    onSubmit: (values: SettingsDictionaryFormValues) => Promise<void>;
    onClose: () => void;
  }>;

//===================================================================

export function SettingsDictionaryFormModal<
  TItem extends SettingsDictionaryItem,
>({
  mode,
  item,
  singularLabel,
  defaultColor,
  currentColor,
  nameDisabled = false,
  isSubmitting,
  submitError,
  onSubmit,
  onClose,
}: SettingsDictionaryFormModalProps<TItem>) {
  const titleId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  const initialName = mode === 'edit' ? (item?.name ?? '') : '';
  const initialColor = currentColor ?? defaultColor ?? '';

  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [nameTouched, setNameTouched] = useState(false);
  const [colorTouched, setColorTouched] = useState(false);

  const nameError = buildReferenceDataNameError(name);
  const colorError = defaultColor
    ? isProductCategoryColor(color)
      ? ''
      : PRODUCT_CATEGORY_COLOR_MESSAGE
    : '';

  const title = `${mode === 'create' ? 'Create' : 'Edit'} ${singularLabel}`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNameTouched(true);
    setColorTouched(true);

    if (nameError || colorError || isSubmitting) return;

    await onSubmit({
      name: name.trim(),
      ...(defaultColor ? { color: normalizeProductCategoryColor(color) } : {}),
    });
  };

  return (
    <ModalRoot>
      <ModalBase
        isOpen
        labelledBy={titleId}
        dialogClassName={css.formDialog}
        initialFocusRef={cancelButtonRef}
        closeOnBackdrop={!isSubmitting}
        closeOnEscape={!isSubmitting}
        onClose={onClose}
      >
        <div className={css.modalHeader}>
          <h2 className={css.modalTitle} id={titleId}>
            {title}
          </h2>

          <CloseIconButton
            label={`Close ${title.toLowerCase()}`}
            disabled={isSubmitting}
            onClick={onClose}
          />
        </div>

        <form className={css.form} onSubmit={handleSubmit} noValidate>
          <NameInput
            id="settings-dictionary-name"
            name="name"
            label="Name"
            value={name}
            maxLength={100}
            autoComplete="off"
            disabled={nameDisabled || isSubmitting}
            hint={
              nameDisabled
                ? 'The name is locked while this item is in use. Other editable metadata can still be updated.'
                : 'Use Latin letters and spaces, starting with an uppercase letter.'
            }
            error={nameError}
            isTouched={nameTouched}
            onChange={(event) => setName(event.target.value)}
          />

          {defaultColor ? (
            <ColorPicker
              id="settings-dictionary-color"
              name="color"
              value={color}
              error={colorError}
              isTouched={colorTouched}
              disabled={isSubmitting}
              onChange={setColor}
            />
          ) : null}

          {submitError ? (
            <p className={css.formError} role="alert">
              {submitError}
            </p>
          ) : null}

          <div className={css.modalActions}>
            <Button
              ref={cancelButtonRef}
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingLabel={mode === 'create' ? 'Creating...' : 'Saving...'}
            >
              {mode === 'create' ? 'Create' : 'Save changes'}
            </Button>
          </div>
        </form>
      </ModalBase>
    </ModalRoot>
  );
}
