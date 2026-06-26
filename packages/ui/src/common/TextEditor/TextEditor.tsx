'use client';

import clsx from 'clsx';
import type { ChangeEvent, RefObject } from 'react';
import { useRef } from 'react';
import { Bold, Italic, List, Pilcrow } from 'lucide-react';

import FormFieldLayout from '../../form-fields/FormFieldLayout/FormFieldLayout';

import css from './TextEditor.module.css';

//===================================================================

export type TextEditorProps = Readonly<{
  id: string;
  name: string;
  value: string;
  label?: string;
  placeholder?: string;
  error?: string;
  isTouched?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
  hint?: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}>;

type TextareaRef = RefObject<HTMLTextAreaElement | null>;

//===================================================================

function createSyntheticTextareaEvent(
  textarea: HTMLTextAreaElement
): ChangeEvent<HTMLTextAreaElement> {
  return {
    target: textarea,
    currentTarget: textarea,
  } as ChangeEvent<HTMLTextAreaElement>;
}

function insertSnippet(
  textareaRef: TextareaRef,
  snippet: string,
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
) {
  const textarea = textareaRef.current;
  if (!textarea) return;

  const { selectionStart, selectionEnd, value } = textarea;
  const selectedText = value.slice(selectionStart, selectionEnd);
  const nextText = snippet.replace('$text', selectedText || 'text');
  const nextValue = `${value.slice(0, selectionStart)}${nextText}${value.slice(selectionEnd)}`;

  textarea.value = nextValue;
  onChange(createSyntheticTextareaEvent(textarea));
  textarea.focus();

  const cursorPosition = selectionStart + nextText.length;
  textarea.setSelectionRange(cursorPosition, cursorPosition);
}

//===================================================================

function TextEditor({
  id,
  name,
  value,
  label = 'Text',
  placeholder = 'Enter text',
  error,
  isTouched,
  required = true,
  disabled = false,
  className,
  maxLength,
  hint,
  onChange,
}: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hasError = Boolean(isTouched && error);
  const describedBy = [hint ? `${id}-hint` : null, hasError ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <FormFieldLayout
      id={id}
      label={label}
      required={required}
      className={clsx(css.field, className)}
      error={error}
      isTouched={isTouched}
      hint={hint}
    >
      <div className={clsx(css.editor, hasError && css.editorInvalid)}>
        <div className={css.toolbar} aria-label={`${label} formatting tools`}>
          <button
            className={css.toolButton}
            type="button"
            disabled={disabled}
            aria-label="Bold"
            onClick={() => insertSnippet(textareaRef, '**$text**', onChange)}
          >
            <Bold size={16} aria-hidden="true" />
          </button>
          <button
            className={css.toolButton}
            type="button"
            disabled={disabled}
            aria-label="Italic"
            onClick={() => insertSnippet(textareaRef, '*$text*', onChange)}
          >
            <Italic size={16} aria-hidden="true" />
          </button>
          <button
            className={css.toolButton}
            type="button"
            disabled={disabled}
            aria-label="List item"
            onClick={() => insertSnippet(textareaRef, '\n- $text', onChange)}
          >
            <List size={16} aria-hidden="true" />
          </button>
          <button
            className={css.toolButton}
            type="button"
            disabled={disabled}
            aria-label="Paragraph break"
            onClick={() => insertSnippet(textareaRef, '\n\n$text', onChange)}
          >
            <Pilcrow size={16} aria-hidden="true" />
          </button>
        </div>

        <div className={css.inputWrap}>
          <textarea
            ref={textareaRef}
            className={css.textarea}
            id={id}
            name={name}
            value={value}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            onChange={onChange}
          />
          {typeof maxLength === 'number' ? (
            <span className={css.counter} aria-hidden="true">
              {value.length}/{maxLength}
            </span>
          ) : null}
        </div>
      </div>
    </FormFieldLayout>
  );
}

export default TextEditor;
export { TextEditor };
