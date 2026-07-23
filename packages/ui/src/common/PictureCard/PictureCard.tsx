'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { ImageOff, Upload } from 'lucide-react';

import { ImagePreview, readFileAsDataUrl } from '../../media';
import Button from '../Button/Button';
import ConfirmationModal from '../../modals/ConfirmationModal/ConfirmationModal';
import { formatInitials } from '../helpers/format-initials';

import css from './PictureCard.module.css';

//===================================================================

const DEFAULT_PICTURE_ACCEPT = 'image/jpeg,image/png,image/webp';

//===================================================================

export type PictureCardLabels = {
  uploadAriaLabel?: string;
  hint?: ReactNode;
  uploadButton?: string;
  savingButton?: string;
  removeButton?: string;
  removeTitle?: string;
  removeText?: string;
  removeConfirm?: string;
  removingConfirm?: string;
  removeCancel?: string;
  uploadError?: string;
};

export type PictureCardProps = {
  name: string;
  pictureUrl: string | null;
  isSaving?: boolean;
  disabled?: boolean;
  accept?: string;
  labels?: PictureCardLabels;
  validateFile?: (file: File) => string | null;
  validatePictureUrl?: (pictureUrl: string) => string | null;
  onChange: (pictureUrl: string | null) => Promise<void> | void;
  onError?: (message: string) => void;
};

//===================================================================

const DEFAULT_LABELS: Required<PictureCardLabels> = {
  uploadAriaLabel: 'Upload photo',
  hint: 'Upload a lightweight JPG, PNG, or WEBP image up to 450 KB. The photo is saved right away.',
  uploadButton: 'Upload photo',
  savingButton: 'Saving...',
  removeButton: 'Remove photo',
  removeTitle: 'Remove photo?',
  removeText: 'This photo will be removed. Are you sure?',
  removeConfirm: 'Remove photo',
  removingConfirm: 'Removing...',
  removeCancel: 'Keep photo',
  uploadError: 'Could not upload photo.',
};

//===================================================================

function PictureCard({
  name,
  pictureUrl,
  isSaving = false,
  disabled = false,
  accept = DEFAULT_PICTURE_ACCEPT,
  labels,
  validateFile,
  validatePictureUrl,
  onChange,
  onError,
}: PictureCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (disabled || isSaving) return;

    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const fileError = validateFile?.(file);

    if (fileError) {
      onError?.(fileError);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const pictureUrlError = validatePictureUrl?.(dataUrl);

      if (pictureUrlError) {
        onError?.(pictureUrlError);
        return;
      }

      await onChange(dataUrl);
    } catch {
      onError?.(mergedLabels.uploadError);
    }
  };

  const handleRemove = async () => {
    if (disabled || isSaving) return;

    setIsConfirmOpen(false);
    await onChange(null);
  };

  return (
    <div className={css.card}>
      <div className={css.picture} aria-hidden="true">
        {pictureUrl ? (
          <ImagePreview className={css.pictureImage} src={pictureUrl} />
        ) : (
          <span>{formatInitials(name)}</span>
        )}
      </div>

      <div className={css.actions}>
        <input
          ref={inputRef}
          className={css.input}
          type="file"
          accept={accept}
          aria-label={mergedLabels.uploadAriaLabel}
          disabled={disabled || isSaving}
          onChange={(event) => void handleFileChange(event)}
        />

        {mergedLabels.hint ? (
          <p className={css.hint}>{mergedLabels.hint}</p>
        ) : null}

        <div className={css.buttons}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled || isSaving}
            isLoading={isSaving}
            loadingLabel={mergedLabels.savingButton}
            iconLeft={<Upload size={16} aria-hidden="true" />}
            onClick={() => inputRef.current?.click()}
          >
            {mergedLabels.uploadButton}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={css.dangerButton}
            disabled={disabled || !pictureUrl || isSaving}
            iconLeft={<ImageOff size={16} aria-hidden="true" />}
            onClick={() => setIsConfirmOpen(true)}
          >
            {mergedLabels.removeButton}
          </Button>
        </div>
      </div>

      {isConfirmOpen ? (
        <ConfirmationModal
          title={mergedLabels.removeTitle}
          text={mergedLabels.removeText}
          confirmLabel={
            isSaving ? mergedLabels.removingConfirm : mergedLabels.removeConfirm
          }
          cancelLabel={mergedLabels.removeCancel}
          isLoading={isSaving}
          onConfirm={() => void handleRemove()}
          onCancel={() => setIsConfirmOpen(false)}
        />
      ) : null}
    </div>
  );
}

export default PictureCard;

export { PictureCard };
