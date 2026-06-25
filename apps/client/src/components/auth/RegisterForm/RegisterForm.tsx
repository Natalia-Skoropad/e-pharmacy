'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Button,
  DocumentUpload,
  RadioOption,
  TextActionButton,
  type DocumentUploadFile,
} from '@e-pharmacy/ui/common';

import { useToast } from '@e-pharmacy/ui/feedback';

import {
  EmailInput,
  NameInput,
  PasswordInput,
  PhoneInput,
} from '@e-pharmacy/ui/form-fields';

import { getAuthErrorCode } from '@e-pharmacy/auth/errors';
import { useAuth } from '@e-pharmacy/auth/core';

import {
  REGISTER_FORM_FIELDS,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  REGISTER_INITIAL_VALUES,
  buildNameError,
  hasValidationErrors,
  isRegisterFormValid,
  markAllFieldsTouched,
  sanitizeName,
  sanitizePhone,
  sanitizeEmail,
  sanitizePassword,
  validateRegisterForm,
  type RegisterFormErrors,
  type RegisterFormValues,
  type RegisterTouchedFields,
} from '@e-pharmacy/validation';

import { getClientAuthErrorMessage, resolveLoginDestination } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';

import css from '../shared/AuthForm.module.css';

//===================================================================

type RegisterAccountType = 'client' | 'pharmacy';

//===================================================================

type PharmacyRegisterTouchedFields = RegisterTouchedFields & {
  pharmacyName?: boolean;
  pharmacyDocuments?: boolean;
};

type PharmacyRegisterErrors = RegisterFormErrors & {
  pharmacyName?: string;
  pharmacyDocuments?: string;
};

//===================================================================

const REGISTER_COPY: Record<
  RegisterAccountType,
  {
    title: string;
    text: string;
    button: string;
    loading: string;
  }
> = {
  client: {
    title: 'Client account',
    text: 'Create a personal account for orders, favorites, checkout details, and profile settings.',
    button: 'Create client account',
    loading: 'Creating account...',
  },
  pharmacy: {
    title: 'Pharmacy owner account',
    text: 'Create a pharmacy account request. Add the pharmacy name and documents so the team can verify the cabinet before full access.',
    button: 'Create pharmacy account',
    loading: 'Creating pharmacy account...',
  },
};

//===================================================================

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { register, isAuthReady } = useAuth();
  const toast = useToast();

  const [accountType, setAccountType] = useState<RegisterAccountType>('client');

  const [values, setValues] = useState<RegisterFormValues>(
    REGISTER_INITIAL_VALUES
  );

  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyDocuments, setPharmacyDocuments] = useState<
    DocumentUploadFile[]
  >([]);

  const [errors, setErrors] = useState<PharmacyRegisterErrors>({});
  const [touchedFields, setTouchedFields] =
    useState<PharmacyRegisterTouchedFields>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const selectedCopy = REGISTER_COPY[accountType];
  const pharmacyNameError = buildNameError(pharmacyName, { required: true });
  const pharmacyDocumentsError =
    accountType === 'pharmacy' && pharmacyDocuments.length === 0
      ? 'Please upload pharmacy documents.'
      : undefined;

  const registerFormIsValid =
    isRegisterFormValid(values) &&
    (accountType === 'client' ||
      (!pharmacyNameError && pharmacyDocuments.length > 0));

  const handleChange =
    (field: keyof RegisterFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const nextValue =
        field === 'name'
          ? sanitizeName(rawValue)
          : field === 'email'
            ? sanitizeEmail(rawValue)
            : field === 'phone'
              ? sanitizePhone(rawValue)
              : sanitizePassword(rawValue);

      const nextValues = {
        ...values,
        [field]: nextValue,
      };

      const nextErrors = validateRegisterForm(nextValues);

      setValues(nextValues);
      setTouchedFields((prev) => ({ ...prev, [field]: true }));
      setErrors((prev: PharmacyRegisterErrors) => ({
        ...prev,
        [field]: nextErrors[field],
      }));
    };

  const handleAccountTypeChange = (nextType: RegisterAccountType) => {
    setAccountType(nextType);

    if (nextType === 'client') {
      setErrors((prev) => ({
        ...prev,
        pharmacyName: undefined,
        pharmacyDocuments: undefined,
      }));
      setTouchedFields((prev) => ({
        ...prev,
        pharmacyName: false,
        pharmacyDocuments: false,
      }));
    }
  };

  const handlePharmacyNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = sanitizeName(event.target.value);
    const nextError = buildNameError(nextValue, { required: true });

    setPharmacyName(nextValue);
    setTouchedFields((prev) => ({ ...prev, pharmacyName: true }));
    setErrors((prev) => ({ ...prev, pharmacyName: nextError }));
  };

  const handleDocumentsChange = (files: DocumentUploadFile[]) => {
    setPharmacyDocuments(files);
    setTouchedFields((prev) => ({ ...prev, pharmacyDocuments: true }));
    setErrors((prev) => ({
      ...prev,
      pharmacyDocuments:
        files.length === 0 ? 'Please upload pharmacy documents.' : undefined,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: PharmacyRegisterErrors = validateRegisterForm(values);

    if (!register) {
      toast.error('Registration is not available for this app.');
      return;
    }

    if (accountType === 'pharmacy') {
      const nextPharmacyNameError = buildNameError(pharmacyName, {
        required: true,
      });

      if (nextPharmacyNameError) {
        nextErrors.pharmacyName = nextPharmacyNameError;
      }

      if (pharmacyDocuments.length === 0) {
        nextErrors.pharmacyDocuments = 'Please upload pharmacy documents.';
      }
    }

    if (hasValidationErrors(nextErrors)) {
      setTouchedFields({
        ...markAllFieldsTouched(REGISTER_FORM_FIELDS),
        pharmacyName: accountType === 'pharmacy',
        pharmacyDocuments: accountType === 'pharmacy',
      });
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      const user = await register({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
        role: accountType,
        pharmacyName:
          accountType === 'pharmacy' ? pharmacyName.trim() : undefined,
        pharmacyDocuments:
          accountType === 'pharmacy'
            ? pharmacyDocuments.map(({ name, size, type }) => ({
                name,
                size,
                type,
              }))
            : undefined,
      });

      const destination = user
        ? resolveLoginDestination({
            user,
            requestedRedirect: searchParams.get('redirect'),
          })
        : ROUTES.PROFILE;

      if (destination.startsWith('http')) {
        window.location.assign(destination);
        return;
      }

      router.replace(destination);
    } catch (error) {
      toast.error(
        getClientAuthErrorMessage(getAuthErrorCode(error, 'register'))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={css.form} noValidate onSubmit={handleSubmit}>
      <fieldset className={css.accountTypeGroup}>
        <legend className={css.accountTypeLegend}>Choose account type</legend>
        <div className={css.accountTypeOptions}>
          <RadioOption
            name="register-account-type"
            value="client"
            checked={accountType === 'client'}
            label="I am a client"
            onChange={handleAccountTypeChange}
          />
          <RadioOption
            name="register-account-type"
            value="pharmacy"
            checked={accountType === 'pharmacy'}
            label="I am a pharmacy owner"
            onChange={handleAccountTypeChange}
          />
        </div>
      </fieldset>

      <div className={css.choiceInfo}>
        <p className={css.choiceTitle}>{selectedCopy.title}</p>
        <p className={css.choiceText}>{selectedCopy.text}</p>
      </div>

      <div className={css.fields}>
        <NameInput
          id="register-name"
          name="name"
          value={values.name}
          error={errors.name}
          isTouched={touchedFields.name}
          maxLength={USER_NAME_MAX_LENGTH}
          onChange={handleChange('name')}
        />

        {accountType === 'pharmacy' ? (
          <NameInput
            id="register-pharmacy-name"
            name="pharmacyName"
            value={pharmacyName}
            label="Pharmacy name"
            placeholder="Your pharmacy name"
            autoComplete="organization"
            error={errors.pharmacyName ?? pharmacyNameError}
            isTouched={touchedFields.pharmacyName}
            maxLength={USER_NAME_MAX_LENGTH}
            onChange={handlePharmacyNameChange}
          />
        ) : null}

        <EmailInput
          id="register-email"
          name="email"
          value={values.email}
          error={errors.email}
          isTouched={touchedFields.email}
          maxLength={USER_EMAIL_MAX_LENGTH}
          onChange={handleChange('email')}
        />

        <PhoneInput
          id="register-phone"
          name="phone"
          value={values.phone}
          error={errors.phone}
          isTouched={touchedFields.phone}
          maxLength={USER_PHONE_MAX_LENGTH}
          onChange={handleChange('phone')}
        />

        <PasswordInput
          id="register-password"
          name="password"
          value={values.password}
          placeholder="Create password"
          autoComplete="new-password"
          error={errors.password}
          isTouched={touchedFields.password}
          isVisible={isPasswordVisible}
          maxLength={USER_PASSWORD_MAX_LENGTH}
          onChange={handleChange('password')}
          onToggleVisibility={() => setIsPasswordVisible((prev) => !prev)}
        />

        {accountType === 'pharmacy' ? (
          <DocumentUpload
            id="register-pharmacy-documents"
            name="pharmacyDocuments"
            value={pharmacyDocuments}
            error={errors.pharmacyDocuments ?? pharmacyDocumentsError}
            isTouched={touchedFields.pharmacyDocuments}
            required
            onChange={handleDocumentsChange}
          />
        ) : null}
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={
          isSubmitting || !isAuthReady || !register || !registerFormIsValid
        }
      >
        {isSubmitting ? selectedCopy.loading : selectedCopy.button}
      </Button>

      <p className={css.footerText}>
        Already have an account?{' '}
        <TextActionButton href={ROUTES.LOGIN}>Log in</TextActionButton>
      </p>
    </form>
  );
}

export default RegisterForm;
