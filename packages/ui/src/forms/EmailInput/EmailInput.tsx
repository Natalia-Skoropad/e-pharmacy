import { TextInputControl } from '../FormFieldLayout/FieldControls';
import type { TextFieldProps } from '../types';

//===================================================================

function EmailInput({
  label = 'Email',
  placeholder = 'example@mail.com',
  autoComplete = 'email',
  ...props
}: TextFieldProps) {
  return (
    <TextInputControl
      {...props}
      label={label}
      placeholder={placeholder}
      autoComplete={autoComplete}
      type="email"
    />
  );
}

export default EmailInput;
export { EmailInput };
