'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ImageOff, Upload } from 'lucide-react';

import {
  PICTURE_ACCEPT,
  buildPictureFileError,
  buildPictureUrlError,
} from '@e-pharmacy/validation';

import PictureUpload from '../PictureUpload/PictureUpload';
import Button from '../Button';
import { ConfirmationModal } from '../../modals';
import { formatInitials } from '../helpers/format-initials';

import css from './PictureCard.module.css';

//===================================================================

type PictureCardProps = {
  name: string;
  pictureUrl: string | null;
  isSaving?: boolean;
  onChange: (pictureUrl: string | null) => Promise<void> | void;
  onError?: (message: string) => void;
};

//===================================================================

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Could not read selected image.'));
    };

    reader.onerror = () => reject(new Error('Could not read selected image.'));
    reader.readAsDataURL(file);
  });
}

//===================================================================

function PictureCard({
  name,
  pictureUrl,
  isSaving = false,
  onChange,
  onError,
}: PictureCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const fileError = buildPictureFileError(file);

    if (fileError) {
      onError?.(fileError);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const pictureUrlError = buildPictureUrlError(dataUrl);

      if (pictureUrlError) {
        onError?.(pictureUrlError);
        return;
      }

      await onChange(dataUrl);
    } catch {
      onError?.('Could not upload photo.');
    }
  };

  const handleRemove = async () => {
    setIsConfirmOpen(false);
    await onChange(null);
  };

  return (
    <div className={css.card}>
      <div className={css.picture} aria-hidden="true">
        {pictureUrl ? (
          <PictureUpload className={css.pictureImage} src={pictureUrl} />
        ) : (
          <span>{formatInitials(name)}</span>
        )}
      </div>

      <div className={css.actions}>
        <input
          ref={inputRef}
          className={css.input}
          type="file"
          accept={PICTURE_ACCEPT}
          aria-label="Upload photo"
          onChange={(event) => void handleFileChange(event)}
        />

        <p className={css.hint}>
          Upload a lightweight JPG, PNG, or WEBP image up to 450 KB. The photo
          is saved right away.
        </p>

        <div className={css.buttons}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isSaving}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={16} aria-hidden="true" />
            {isSaving ? 'Saving...' : 'Upload photo'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={css.dangerButton}
            disabled={!pictureUrl || isSaving}
            onClick={() => setIsConfirmOpen(true)}
          >
            <ImageOff size={16} aria-hidden="true" />
            Remove photo
          </Button>
        </div>
      </div>

      {isConfirmOpen ? (
        <ConfirmationModal
          title="Remove photo?"
          text="This photo will be removed. Are you sure?"
          confirmLabel={isSaving ? 'Removing...' : 'Remove photo'}
          cancelLabel="Keep photo"
          isLoading={isSaving}
          onConfirm={() => void handleRemove()}
          onCancel={() => setIsConfirmOpen(false)}
        />
      ) : null}
    </div>
  );
}

export default PictureCard;
