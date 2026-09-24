import {
  PictureCard,
  type PictureCardLabels,
  type PictureCardProps,
} from '../media/PictureCard/PictureCard';

//===================================================================

const PROFILE_PICTURE_LABELS: PictureCardLabels = {
  uploadAriaLabel: 'Upload profile photo',
  hint: 'Upload a lightweight JPG, PNG, or WEBP profile photo.',
  uploadButton: 'Upload photo',
  savingButton: 'Saving...',
  removeButton: 'Remove photo',
  removeTitle: 'Remove profile photo?',
  removeText: 'This profile photo will be removed. Are you sure?',
  removeConfirm: 'Remove photo',
  removingConfirm: 'Removing...',
  removeCancel: 'Keep photo',
  uploadError: 'Could not upload the profile photo.',
};

//===================================================================

export type ProfilePictureEditorProps = Omit<PictureCardProps, 'labels'> &
  Readonly<{
    labels?: PictureCardLabels;
  }>;

//===================================================================

export function ProfilePictureEditor({
  labels,
  ...props
}: ProfilePictureEditorProps) {
  return (
    <PictureCard
      {...props}
      labels={{
        ...PROFILE_PICTURE_LABELS,
        ...labels,
      }}
    />
  );
}
