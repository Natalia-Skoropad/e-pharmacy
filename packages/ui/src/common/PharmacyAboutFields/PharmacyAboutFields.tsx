'use client';

import { CommentInput } from '../../form-fields/CommentInput';

//===================================================================

export type PharmacyAboutFieldsProps = {
  description: string;
  descriptionError?: string;
  isDescriptionTouched?: boolean;
  disabled?: boolean;
  className?: string;
  onDescriptionChange: (value: string) => void;
};

//===================================================================

function PharmacyAboutFields({
  description,
  descriptionError,
  isDescriptionTouched,
  disabled = false,
  className,
  onDescriptionChange,
}: PharmacyAboutFieldsProps) {
  return (
    <div className={className}>
      <CommentInput
        id="pharmacy-description"
        name="description"
        label="Pharmacy description"
        placeholder="Tell clients about your pharmacy, service standards, delivery or pickup details, and useful health services."
        value={description}
        required
        disabled={disabled}
        error={descriptionError}
        isTouched={isDescriptionTouched}
        maxLength={5000}
        onChange={(event) => onDescriptionChange(event.target.value)}
      />
    </div>
  );
}

export default PharmacyAboutFields;
export { PharmacyAboutFields };
