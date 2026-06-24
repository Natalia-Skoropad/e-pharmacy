import type { ChangeEventHandler, ReactNode } from 'react';

//===================================================================

export type FieldAriaProps = {
  ariaDescribedBy?: string;
};

export type AuthFieldBaseProps = FieldAriaProps & {
  id: string;
  name: string;
  value: string;
  error?: string;
  isTouched?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  pattern?: string;
  hint?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

//===================================================================

export type AddressFieldProps = Omit<
  AuthFieldBaseProps,
  'onChange' | 'autoComplete' | 'pattern'
> & {
  autoComplete?: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
};

//===================================================================

export type CommentFieldProps = Omit<
  AuthFieldBaseProps,
  'onChange' | 'autoComplete' | 'pattern'
> & {
  errorClassName?: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
};

//===================================================================

export type PasswordFieldProps = AuthFieldBaseProps & {
  autoComplete: 'current-password' | 'new-password';
  isVisible: boolean;
  labelAction?: ReactNode;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  onToggleVisibility: () => void;
};

//===================================================================

export type FormFieldLayoutProps = {
  id: string;
  label: string;
  required?: boolean;
  labelAction?: ReactNode;
  children: ReactNode;
  className?: string;
  errorClassName?: string;
  error?: string;
  isTouched?: boolean;
  hint?: string;
};
