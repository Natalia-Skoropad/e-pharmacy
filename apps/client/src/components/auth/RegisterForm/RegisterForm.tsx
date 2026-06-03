'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, TextActionButton } from '@/components/common';
import {
  EmailInput,
  NameInput,
  PasswordInput,
  PhoneInput,
} from '@/components/form-fields';

import { useToast } from '@e-pharmacy/hooks';
import { getAuthErrorMessage } from '@/lib/auth';
import { ROUTES } from '@/lib/constants/routes';
import { getSafeRedirectPath } from '@/lib/routes';

import {
  REGISTER_INITIAL_VALUES,
  sanitizeCustomerName,
  sanitizeCustomerPhone,
  sanitizeEmail,
  validateRegisterForm,
  type RegisterFormErrors,
  type RegisterFormValues,
} from '@/lib/validations/auth-validation';

import { useAuth } from '@/providers';

import css from '../shared/AuthForm.module.css';

//===================================================================

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { register, isAuthReady } = useAuth();
  const toast = useToast();

  const [values, setValues] = useState<RegisterFormValues>(
    REGISTER_INITIAL_VALUES
  );
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof RegisterFormValues, boolean>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));
  const registerFormIsValid =
    Object.keys(validateRegisterForm(values)).length === 0;

  const handleChange =
    (field: keyof RegisterFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const nextValue =
        field === 'name'
          ? sanitizeCustomerName(rawValue)
          : field === 'email'
            ? sanitizeEmail(rawValue)
            : field === 'phone'
              ? sanitizeCustomerPhone(rawValue)
              : rawValue;

      const nextValues = {
        ...values,
        [field]: nextValue,
      };
      const nextErrors = validateRegisterForm(nextValues);

      setValues(nextValues);
      setTouchedFields((prev) => ({ ...prev, [field]: true }));
      setErrors((prev: RegisterFormErrors) => ({
        ...prev,
        [field]: nextErrors[field],
      }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateRegisterForm(values);

    if (Object.keys(nextErrors).length > 0) {
      setTouchedFields({
        name: true,
        email: true,
        phone: true,
        password: true,
      });
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
      });

      router.replace(redirectTo);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={css.form} noValidate onSubmit={handleSubmit}>
      <div className={css.fields}>
        <NameInput
          id="register-name"
          name="name"
          value={values.name}
          error={errors.name}
          isTouched={touchedFields.name}
          onChange={handleChange('name')}
        />

        <EmailInput
          id="register-email"
          name="email"
          value={values.email}
          error={errors.email}
          isTouched={touchedFields.email}
          onChange={handleChange('email')}
        />

        <PhoneInput
          id="register-phone"
          name="phone"
          value={values.phone}
          error={errors.phone}
          isTouched={touchedFields.phone}
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
          onChange={handleChange('password')}
          onToggleVisibility={() => setIsPasswordVisible((prev) => !prev)}
        />
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={isSubmitting || !isAuthReady || !registerFormIsValid}
      >
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>

      <p className={css.footerText}>
        Already have an account?{' '}
        <TextActionButton href={ROUTES.LOGIN}>Log in</TextActionButton>
      </p>
    </form>
  );
}

export default RegisterForm;
