'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, TextActionButton } from '@e-pharmacy/ui/primitives';
import { DocumentUpload, RadioOption } from '@e-pharmacy/ui/forms';
import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';
import { useToast } from '@e-pharmacy/ui/feedback';

import {
  EmailInput,
  NameInput,
  PasswordInput,
  PhoneInput,
} from '@e-pharmacy/ui/forms';

import { getAuthErrorCode } from '@e-pharmacy/auth/errors';
import { useAuth } from '@e-pharmacy/auth/react';

import {
  REGISTER_FORM_FIELDS,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  REGISTER_INITIAL_VALUES,
  hasValidationErrors,
  isRegisterFormValid,
  markAllFieldsTouched,
  normalizePhoneInput,
  normalizeEmail,
  validateRegisterForm,
  type RegisterFormErrors,
  type RegisterFormValues,
  type RegisterTouchedFields,
} from '@e-pharmacy/validation/auth';

import {
  PHARMACY_DOCUMENT_ACCEPT,
  PHARMACY_DOCUMENT_RULES,
  normalizePharmacyDocument,
  validatePharmacyDocuments,
} from '@e-pharmacy/validation/files';

import { getClientAuthErrorMessage, resolveLoginDestination } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { REGISTER_TITLE } from '@/lib/seo';

import css from '../shared/AuthForm.module.css';

//===================================================================

type RegisterAccountType = 'client' | 'pharmacy';

//===================================================================

type PharmacyRegisterTouchedFields = RegisterTouchedFields & {
  pharmacyDocuments?: boolean;
};

type PharmacyRegisterErrors = RegisterFormErrors & {
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
    text: 'Create a personal account to order medicines, save favorites, manage checkout details, and keep profile settings in one place.',
    button: 'Create account',
    loading: 'Creating account...',
  },

  pharmacy: {
    title: 'Pharmacy owner account',
    text: 'Create a pharmacy owner account and upload documents that confirm your right to manage the pharmacy cabinet.',
    button: 'Create pharmacy account',
    loading: 'Creating pharmacy account...',
  },
};

//===================================================================

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { register, isBootstrapping } = useAuth();
  const toast = useToast();

  const [accountType, setAccountType] = useState<RegisterAccountType>('client');

  const [values, setValues] = useState<RegisterFormValues>(
    REGISTER_INITIAL_VALUES
  );

  const [pharmacyDocuments, setPharmacyDocuments] = useState<BrowserUploadFile[]>(
    []
  );

  const [errors, setErrors] = useState<PharmacyRegisterErrors>({});
  const [touchedFields, setTouchedFields] =
    useState<PharmacyRegisterTouchedFields>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const selectedCopy = REGISTER_COPY[accountType];
  const pharmacyDocumentsError =
    accountType === 'pharmacy'
      ? validatePharmacyDocuments(pharmacyDocuments, { required: true })
      : '';

  const registerFormIsValid =
    isRegisterFormValid(values) && !pharmacyDocumentsError;

  const handleChange =
    (field: keyof RegisterFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const nextValue =
        field === 'email'
          ? normalizeEmail(rawValue)
          : field === 'phone'
            ? normalizePhoneInput(rawValue)
            : rawValue;

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
        pharmacyDocuments: undefined,
      }));
      setTouchedFields((prev) => ({
        ...prev,
        pharmacyDocuments: false,
      }));
    }
  };

  const handleDocumentsChange = (files: BrowserUploadFile[]) => {
    const documentsError = validatePharmacyDocuments(files, { required: true });

    setTouchedFields((prev) => ({ ...prev, pharmacyDocuments: true }));
    setErrors((prev) => ({
      ...prev,
      pharmacyDocuments: documentsError || undefined,
    }));

    if (documentsError && files.length > 0) return;
    setPharmacyDocuments(files);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: PharmacyRegisterErrors = validateRegisterForm(values);

    if (!register) {
      toast.error('Registration is not available for this app.');
      return;
    }

    if (accountType === 'pharmacy') {
      nextErrors.pharmacyDocuments =
        validatePharmacyDocuments(pharmacyDocuments, { required: true }) ||
        undefined;
    }

    if (hasValidationErrors(nextErrors)) {
      setTouchedFields({
        ...markAllFieldsTouched(REGISTER_FORM_FIELDS),
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
        pharmacyDocuments:
          accountType === 'pharmacy'
            ? pharmacyDocuments.map(normalizePharmacyDocument)
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
      <div className={css.authTitleBlock}>
        <h1 className={css.authTitle}>{REGISTER_TITLE}</h1>
      </div>

      <fieldset className={css.accountTypeGroup}>
        <legend className={css.visuallyHidden}>Account type</legend>
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
            className={css.fieldFull}
            id="register-pharmacy-documents"
            name="pharmacyDocuments"
            value={pharmacyDocuments}
            error={errors.pharmacyDocuments ?? pharmacyDocumentsError}
            isTouched={touchedFields.pharmacyDocuments}
            required
            confirmRemove
            maxFiles={PHARMACY_DOCUMENT_RULES.maxFiles}
            accept={PHARMACY_DOCUMENT_ACCEPT}
            hint={`PDF, DOC, DOCX, JPG, PNG, or WEBP. Up to ${PHARMACY_DOCUMENT_RULES.maxFiles} files, 10 MB each.`}
            validateSelection={(files) => validatePharmacyDocuments(files)}
            onSelectionError={(message) =>
              setErrors((prev) => ({
                ...prev,
                pharmacyDocuments: message,
              }))
            }
            onChange={handleDocumentsChange}
          />
        ) : null}
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={
          isSubmitting || isBootstrapping || !register || !registerFormIsValid
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
