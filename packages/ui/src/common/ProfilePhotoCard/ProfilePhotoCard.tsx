'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ImageOff, Upload } from 'lucide-react';

import {
  AVATAR_ACCEPT,
  buildAvatarFileError,
  buildAvatarUrlError,
} from '@e-pharmacy/validation';

import AvatarImage from '../AvatarImage/AvatarImage';
import Button from '../Button';
import { ConfirmationModal } from '../../modals';
import { formatInitials } from '@e-pharmacy/utils/formatters';

import css from './ProfilePhotoCard.module.css';

//===================================================================

type ProfilePhotoCardProps = {
  name: string;
  avatarUrl: string | null;
  isSaving?: boolean;
  onChange: (avatarUrl: string | null) => Promise<void> | void;
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

function ProfilePhotoCard({
  name,
  avatarUrl,
  isSaving = false,
  onChange,
  onError,
}: ProfilePhotoCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const fileError = buildAvatarFileError(file);

    if (fileError) {
      onError?.(fileError);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const avatarUrlError = buildAvatarUrlError(dataUrl);

      if (avatarUrlError) {
        onError?.(avatarUrlError);
        return;
      }

      await onChange(dataUrl);
    } catch {
      onError?.('Could not upload profile photo.');
    }
  };

  const handleRemove = async () => {
    setIsConfirmOpen(false);
    await onChange(null);
  };

  return (
    <div className={css.card}>
      <div className={css.avatar} aria-hidden="true">
        {avatarUrl ? (
          <AvatarImage className={css.avatarImage} src={avatarUrl} />
        ) : (
          <span>{formatInitials(name)}</span>
        )}
      </div>

      <div className={css.actions}>
        <input
          ref={inputRef}
          className={css.input}
          type="file"
          accept={AVATAR_ACCEPT}
          aria-label="Upload profile photo"
          onChange={(event) => void handleFileChange(event)}
        />

        <p className={css.hint}>
          Upload a lightweight JPG, PNG, or WEBP image up to 450 KB. The photo
          is saved to your profile right away.
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
            disabled={!avatarUrl || isSaving}
            onClick={() => setIsConfirmOpen(true)}
          >
            <ImageOff size={16} aria-hidden="true" />
            Remove photo
          </Button>
        </div>
      </div>

      {isConfirmOpen ? (
        <ConfirmationModal
          title="Remove profile photo?"
          text="This photo will be removed from your account. Are you sure?"
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

export default ProfilePhotoCard;
