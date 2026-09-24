'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { KeyRound } from 'lucide-react';

import {
  USER_PASSWORD_MAX_LENGTH,
  validateChangePasswordForm,
  type ChangePasswordFormValues,
} from '@e-pharmacy/validation/profile';

import { PasswordInput } from '../forms/PasswordInput/PasswordInput';
import { Button } from '../primitives/Button/Button';

import css from './Profile.module.css';

//===================================================================

type ChangePasswordField =
  | 'currentPassword'
  | 'newPassword'
  | 'confirmPassword';

type ChangePasswordUiValues = ChangePasswordFormValues &
  Readonly<{
    confirmPassword: string;
  }>;

type ChangePasswordUiErrors = Partial<Record<ChangePasswordField, string>>;
type ChangePasswordUiTouched = Partial<Record<ChangePasswordField, boolean>>;

//===================================================================

const INITIAL_VALUES: ChangePasswordUiValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const ALL_FIELDS: ChangePasswordField[] = [
  'currentPassword',
  'newPassword',
  'confirmPassword',
];

//===================================================================

export type ChangePasswordFormProps = Readonly<{
  idPrefix?: string;
  title?: string;
  description?: ReactNode;
  submitLabel?: string;
  savingLabel?: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  error?: string;
  resetOnSuccess?: boolean;
  onSubmit: (
    values: Readonly<ChangePasswordFormValues>
  ) => Promise<void> | void;
}>;

//===================================================================

function validateValues(
  values: ChangePasswordUiValues
): ChangePasswordUiErrors {
  const coreErrors = validateChangePasswordForm({
    currentPassword: values.currentPassword,
    newPassword: values.newPassword,
  });

  const errors: ChangePasswordUiErrors = { ...coreErrors };

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your new password.';
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

//===================================================================

export function ChangePasswordForm({
  idPrefix = 'profile-password',
  title = 'Change password',
  description = 'Use this section only when you want to update your account login password.',
  submitLabel = 'Change password',
  savingLabel = 'Saving...',
  disabled = false,
  isSubmitting = false,
  error = '',
  resetOnSuccess = false,
  onSubmit,
}: ChangePasswordFormProps) {
  const [values, setValues] = useState<ChangePasswordUiValues>(INITIAL_VALUES);
  const [touched, setTouched] = useState<ChangePasswordUiTouched>({});

  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] =
    useState(false);

  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);

  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const [isSubmittingLocally, setIsSubmittingLocally] = useState(false);
  const [localSubmitError, setLocalSubmitError] = useState('');

  const errors = useMemo(() => validateValues(values), [values]);
  const submitting = isSubmitting || isSubmittingLocally;

  const handleChange = (field: ChangePasswordField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [field]: true }));
    setLocalSubmitError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const allTouched = Object.fromEntries(
      ALL_FIELDS.map((field) => [field, true])
    ) as ChangePasswordUiTouched;

    setTouched(allTouched);
    setLocalSubmitError('');

    if (disabled || submitting || Object.keys(errors).length > 0) return;

    setIsSubmittingLocally(true);

    try {
      await onSubmit({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (resetOnSuccess) {
        setValues(INITIAL_VALUES);
        setTouched({});
      }
    } catch {
      setLocalSubmitError('Could not change the password. Please try again.');
    } finally {
      setIsSubmittingLocally(false);
    }
  };

  const displayedSubmitError = error || localSubmitError;

  return (
    <form
      className={css.panel}
      aria-labelledby={`${idPrefix}-title`}
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className={css.panelHeader}>
        <h2 className={css.panelTitle} id={`${idPrefix}-title`}>
          {title}
        </h2>
        {description ? <p className={css.panelText}>{description}</p> : null}
      </div>

      <Button
        className={css.panelAction}
        type="submit"
        iconLeft={<KeyRound size={18} aria-hidden="true" />}
        disabled={disabled || submitting || Object.keys(errors).length > 0}
        isLoading={submitting}
        loadingLabel={savingLabel}
      >
        {submitLabel}
      </Button>

      <div className={`${css.formGrid} ${css.panelBody}`}>
        <PasswordInput
          id={`${idPrefix}-current`}
          name="currentPassword"
          label="Current password"
          value={values.currentPassword}
          error={errors.currentPassword}
          isTouched={Boolean(touched.currentPassword)}
          autoComplete="current-password"
          maxLength={USER_PASSWORD_MAX_LENGTH}
          disabled={disabled || submitting}
          isVisible={isCurrentPasswordVisible}
          onToggleVisibility={() =>
            setIsCurrentPasswordVisible((current) => !current)
          }
          onChange={(event) =>
            handleChange('currentPassword', event.target.value)
          }
        />

        <PasswordInput
          id={`${idPrefix}-new`}
          name="newPassword"
          label="New password"
          value={values.newPassword}
          error={errors.newPassword}
          isTouched={Boolean(touched.newPassword)}
          autoComplete="new-password"
          maxLength={USER_PASSWORD_MAX_LENGTH}
          disabled={disabled || submitting}
          isVisible={isNewPasswordVisible}
          onToggleVisibility={() =>
            setIsNewPasswordVisible((current) => !current)
          }
          onChange={(event) => handleChange('newPassword', event.target.value)}
        />

        <PasswordInput
          id={`${idPrefix}-confirm`}
          name="confirmPassword"
          label="Confirm new password"
          value={values.confirmPassword}
          error={errors.confirmPassword}
          isTouched={Boolean(touched.confirmPassword)}
          autoComplete="new-password"
          maxLength={USER_PASSWORD_MAX_LENGTH}
          disabled={disabled || submitting}
          isVisible={isConfirmPasswordVisible}
          onToggleVisibility={() =>
            setIsConfirmPasswordVisible((current) => !current)
          }
          onChange={(event) =>
            handleChange('confirmPassword', event.target.value)
          }
        />

        {displayedSubmitError ? (
          <p className={css.formError} role="alert">
            {displayedSubmitError}
          </p>
        ) : null}
      </div>
    </form>
  );
}
