import { TextareaControl } from '../FormFieldLayout/FieldControls';
import type { CommentFieldProps } from '../types';

//===================================================================

function CommentInput({
  label = 'Comment for pharmacy',
  placeholder = 'Add details for the pharmacy if needed',
  required = false,
  ...props
}: CommentFieldProps) {
  return (
    <TextareaControl
      {...props}
      label={label}
      placeholder={placeholder}
      required={required}
    />
  );
}

export default CommentInput;
export { CommentInput };
