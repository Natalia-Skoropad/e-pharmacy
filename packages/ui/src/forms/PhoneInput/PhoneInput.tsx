import { TextInputControl } from '../FormFieldLayout/FieldControls';
import type { TextFieldProps } from '../types';

//===================================================================

function PhoneInput({
  label = 'Phone',
  placeholder = '+380XXXXXXXXX',
  autoComplete = 'tel',
  ...props
}: TextFieldProps) {
  return (
    <TextInputControl
      {...props}
      label={label}
      placeholder={placeholder}
      autoComplete={autoComplete}
      type="tel"
      inputMode="tel"
    />
  );
}

export default PhoneInput;
export { PhoneInput };
