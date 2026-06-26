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
  textarea: HTMLTextAreaElement,
  value: string
): ChangeEvent<HTMLTextAreaElement> {
  const target = {
    ...textarea,
    value,
    name: textarea.name,
    id: textarea.id,
  } as HTMLTextAreaElement;

  return {
    target,
    currentTarget: target,
  } as ChangeEvent<HTMLTextAreaElement>;
}

function getLimitedValue(value: string, maxLength?: number): string {
  return typeof maxLength === 'number' ? value.slice(0, maxLength) : value;
}

function insertSnippet({
  textareaRef,
  snippet,
  value,
  maxLength,
  onChange,
}: {
  textareaRef: TextareaRef;
  snippet: string;
  value: string;
  maxLength?: number;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  const textarea = textareaRef.current;
  if (!textarea) return;

  const { selectionStart, selectionEnd } = textarea;
  const selectedText = value.slice(selectionStart, selectionEnd);
  const nextText = snippet.replace('$text', selectedText || 'text');
  const nextValue = getLimitedValue(
    `${value.slice(0, selectionStart)}${nextText}${value.slice(selectionEnd)}`,
    maxLength
  );

  onChange(createSyntheticTextareaEvent(textarea, nextValue));
  textarea.focus();

  window.requestAnimationFrame(() => {
    const cursorPosition = Math.min(selectionStart + nextText.length, nextValue.length);
    textarea.setSelectionRange(cursorPosition, cursorPosition);
  });
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
  const describedBy =
    [hint ? `${id}-hint` : null, hasError ? `${id}-error` : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const insert = (snippet: string) => {
    insertSnippet({ textareaRef, snippet, value, maxLength, onChange });
  };

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
            onClick={() => insert('**$text**')}
          >
            <Bold size={16} aria-hidden="true" />
          </button>
          <button
            className={css.toolButton}
            type="button"
            disabled={disabled}
            aria-label="Italic"
            onClick={() => insert('*$text*')}
          >
            <Italic size={16} aria-hidden="true" />
          </button>
          <button
            className={css.toolButton}
            type="button"
            disabled={disabled}
            aria-label="List item"
            onClick={() => insert('\n- $text')}
          >
            <List size={16} aria-hidden="true" />
          </button>
          <button
            className={css.toolButton}
            type="button"
            disabled={disabled}
            aria-label="Paragraph break"
            onClick={() => insert('\n\n$text')}
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
