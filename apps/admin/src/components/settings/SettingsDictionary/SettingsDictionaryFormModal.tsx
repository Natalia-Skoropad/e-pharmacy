'use client';

import { Plus, Save, X } from 'lucide-react';
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
    contextLabel: string;
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

function isDuplicateNameError(message: string | null | undefined): boolean {
  return Boolean(
    message && /\bwith this name already exists\.?$/i.test(message.trim())
  );
}

//===================================================================

export function SettingsDictionaryFormModal<
  TItem extends SettingsDictionaryItem,
>({
  mode,
  item,
  contextLabel,
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
  const [lastSubmittedName, setLastSubmittedName] = useState<string | null>(
    null
  );

  const clientNameError = buildReferenceDataNameError(name);
  const duplicateNameError =
    isDuplicateNameError(submitError) && lastSubmittedName === name.trim()
      ? (submitError ?? null)
      : null;
  const nameError = clientNameError || duplicateNameError || '';
  const isNameTouched = nameTouched || Boolean(duplicateNameError);
  const colorError = defaultColor
    ? isProductCategoryColor(color)
      ? ''
      : PRODUCT_CATEGORY_COLOR_MESSAGE
    : '';

  const title = `${mode === 'create' ? 'Create' : 'Edit'} ${singularLabel}`;
  const nonFieldSubmitError =
    submitError && !isDuplicateNameError(submitError) ? submitError : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNameTouched(true);
    setColorTouched(true);

    if (nameError || colorError || isSubmitting) return;

    const normalizedName = name.trim();
    setLastSubmittedName(normalizedName);

    await onSubmit({
      name: normalizedName,
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
          <div className={css.modalHeaderCopy}>
            <p className={css.modalKicker}>{contextLabel}</p>
            <h2 className={css.modalTitle} id={titleId}>
              {title}
            </h2>
          </div>

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
                ? 'The name is locked while this item is in use.'
                : 'Use Latin letters and spaces, starting with an uppercase letter.'
            }
            error={nameError}
            isTouched={isNameTouched}
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

          {nonFieldSubmitError ? (
            <p className={css.formError} role="alert">
              {nonFieldSubmitError}
            </p>
          ) : null}

          <div className={css.modalActions}>
            <Button
              ref={cancelButtonRef}
              className={css.cancelButton}
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              iconLeft={<X size={18} aria-hidden="true" />}
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingLabel={mode === 'create' ? 'Creating...' : 'Saving...'}
              iconLeft={
                mode === 'create' ? (
                  <Plus size={18} aria-hidden="true" />
                ) : (
                  <Save size={18} aria-hidden="true" />
                )
              }
            >
              {mode === 'create' ? 'Create' : 'Save changes'}
            </Button>
          </div>
        </form>
      </ModalBase>
    </ModalRoot>
  );
}
