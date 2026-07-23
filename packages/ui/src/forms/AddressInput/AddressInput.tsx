import { TextareaControl } from '../FormFieldLayout/FieldControls';
import type { AddressFieldProps } from '../types';

//===================================================================

function AddressInput({
  label = 'Delivery address / post office',
  placeholder = 'Example: 12 Central Street, Nova Poshta office #5, Kyiv',
  autoComplete = 'street-address',
  required = true,
  ...props
}: AddressFieldProps) {
  return (
    <TextareaControl
      {...props}
      label={label}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required={required}
    />
  );
}

export default AddressInput;
export { AddressInput };
