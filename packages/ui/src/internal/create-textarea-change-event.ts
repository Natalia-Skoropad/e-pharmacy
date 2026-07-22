import type { ChangeEvent } from 'react';

//===================================================================

type TextareaIdentity = Pick<HTMLTextAreaElement, 'id' | 'name'>;

//===================================================================

export function createTextareaChangeEvent(
  textarea: TextareaIdentity,
  value: string
): ChangeEvent<HTMLTextAreaElement> {
  const target = {
    id: textarea.id,
    name: textarea.name,
    value,
  } as HTMLTextAreaElement;

  return {
    target,
    currentTarget: target,
  } as ChangeEvent<HTMLTextAreaElement>;
}
