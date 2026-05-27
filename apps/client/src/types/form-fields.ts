import type { ChangeEventHandler, ReactNode } from 'react';

//===================================================================

export type AuthFieldBaseProps = {
  id: string;
  name: string;
  value: string;
  error?: string;
  isTouched?: boolean;
  required?: boolean;
  className?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export type AddressFieldProps = Omit<AuthFieldBaseProps, 'onChange'> & {
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
};

export type CommentFieldProps = Omit<AuthFieldBaseProps, 'onChange'> & {
  label?: string;
  placeholder?: string;
  maxLength?: number;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
};

export type PasswordFieldProps = AuthFieldBaseProps & {
  label?: string;
  placeholder?: string;
  autoComplete: 'current-password' | 'new-password';
  isVisible: boolean;
  labelAction?: ReactNode;
  onToggleVisibility: () => void;
};
