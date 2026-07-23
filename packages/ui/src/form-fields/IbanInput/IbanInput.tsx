import { IBAN_INPUT_ATTRIBUTES } from '@e-pharmacy/validation/pharmacy';

import { TextInputControl } from '../FormFieldLayout/FieldControls';
import type { TextFieldProps } from '../types';

//===================================================================

function IbanInput({
  label = 'IBAN',
  placeholder = IBAN_INPUT_ATTRIBUTES.placeholder,
  autoComplete = 'off',
  maxLength = IBAN_INPUT_ATTRIBUTES.maxLength,
  pattern = IBAN_INPUT_ATTRIBUTES.pattern,
  hint = IBAN_INPUT_ATTRIBUTES.hint,
  ...props
}: TextFieldProps) {
  return (
    <TextInputControl
      {...props}
      label={label}
      placeholder={placeholder}
      autoComplete={autoComplete}
      maxLength={maxLength}
      pattern={pattern}
      hint={hint}
      type="text"
    />
  );
}

export default IbanInput;
export { IbanInput };
