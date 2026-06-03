'use client';

import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ImageOff, Upload } from 'lucide-react';

import AvatarImage from '../AvatarImage';
import Button from '../Button';
import ConfirmActionModal from '../ConfirmActionModal';
import { formatInitials } from '../../utils/formatInitials';

import css from './ProfilePhotoCard.module.css';

//===================================================================

const AVATAR_MAX_FILE_SIZE = 450 * 1024;
const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

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

function getAvatarFileError(file: File): string {
  if (
    !AVATAR_ALLOWED_TYPES.includes(
      file.type as (typeof AVATAR_ALLOWED_TYPES)[number]
    )
  ) {
    return 'Please choose a JPG, PNG, or WEBP image.';
  }

  if (file.size > AVATAR_MAX_FILE_SIZE) {
    return 'Profile photo must be up to 450 KB.';
  }

  return '';
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

    const fileError = getAvatarFileError(file);

    if (fileError) {
      onError?.(fileError);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
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
          accept="image/jpeg,image/png,image/webp"
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
        <ConfirmActionModal
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
