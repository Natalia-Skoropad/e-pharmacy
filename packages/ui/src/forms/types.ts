import type { ChangeEventHandler, ReactNode } from 'react';

//===================================================================

export type FieldAriaProps = {
  ariaDescribedBy?: string;
};

//===================================================================

export type BaseFieldProps = FieldAriaProps & {
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
  maxLength?: number;
  hint?: string;
};

//===================================================================

export type TextFieldProps = BaseFieldProps & {
  autoComplete?: string;
  pattern?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

//===================================================================

export type AddressFieldProps = Omit<TextFieldProps, 'onChange' | 'pattern'> & {
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
};

//===================================================================

export type CommentFieldProps = Omit<
  TextFieldProps,
  'onChange' | 'autoComplete' | 'pattern'
> & {
  errorClassName?: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
};

//===================================================================

export type PasswordFieldProps = TextFieldProps & {
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
