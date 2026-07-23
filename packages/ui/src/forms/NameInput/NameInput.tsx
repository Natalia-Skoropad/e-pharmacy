import { TextInputControl } from '../FormFieldLayout/FieldControls';
import type { TextFieldProps } from '../types';

//===================================================================

function NameInput({
  label = 'Name',
  placeholder = 'Enter name',
  autoComplete = 'name',
  ...props
}: TextFieldProps) {
  return (
    <TextInputControl
      {...props}
      label={label}
      placeholder={placeholder}
      autoComplete={autoComplete}
      type="text"
    />
  );
}

export default NameInput;
export { NameInput };
