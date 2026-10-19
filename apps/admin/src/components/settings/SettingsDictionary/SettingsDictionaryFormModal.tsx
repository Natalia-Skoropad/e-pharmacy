'use client';

import { Palette, Plus, Save, Shapes, X } from 'lucide-react';
import { useId, useRef, useState, type FormEvent } from 'react';

import {
  ColorPicker,
  NameInput,
  CategoryIconPicker,
} from '@e-pharmacy/ui/forms';

import { ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';
import { Tabs } from '@e-pharmacy/ui/navigation';
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
  const [activeTab, setActiveTab] = useState<'details' | 'color'>('details');
  const [color, setColor] = useState(initialColor);

  const [icon, setIcon] = useState(
    (item as (TItem & { icon?: string }) | undefined)?.icon ??
      (mode === 'edit' ? 'pill' : '')
  );

  const [nameTouched, setNameTouched] = useState(false);
  const [colorTouched, setColorTouched] = useState(false);
  const [iconTouched, setIconTouched] = useState(false);

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
    setIconTouched(true);

    if (nameError || colorError || (defaultColor && !icon) || isSubmitting) {
      if (nameError || (defaultColor && !icon)) setActiveTab('details');
      else if (colorError) setActiveTab('color');

      return;
    }

    const normalizedName = name.trim();
    setLastSubmittedName(normalizedName);

    await onSubmit({
      name: normalizedName,

      ...(defaultColor
        ? { color: normalizeProductCategoryColor(color), icon }
        : {}),
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
          {defaultColor ? (
            <Tabs
              idBase="settings-category"
              ariaLabel="Product category settings"
              activeValue={activeTab}
              mobileVisibleCount={2}
              items={[
                {
                  value: 'details',
                  label: 'Name & icon',
                  icon: <Shapes size={17} />,
                },
                { value: 'color', label: 'Color', icon: <Palette size={17} /> },
              ]}
              onChange={setActiveTab}
            />
          ) : null}

          <div
            className={css.formTabPanel}
            hidden={Boolean(defaultColor) && activeTab !== 'details'}
          >
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
              <CategoryIconPicker
                value={icon}
                onChange={setIcon}
                disabled={isSubmitting}
              />
            ) : null}
            {defaultColor && iconTouched && !icon ? (
              <p className={css.formError} role="alert">
                Choose a category icon.
              </p>
            ) : null}
          </div>

          {defaultColor ? (
            <div className={css.formTabPanel} hidden={activeTab !== 'color'}>
              <ColorPicker
                id="settings-dictionary-color"
                name="color"
                value={color}
                error={colorError}
                isTouched={colorTouched}
                disabled={isSubmitting}
                onChange={setColor}
              />
            </div>
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
