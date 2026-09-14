'use client';

import clsx from 'clsx';
import { Bold, Italic, Link2, List, ListOrdered } from 'lucide-react';

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
} from 'react';

import FormFieldLayout from '../FormFieldLayout/FormFieldLayout';

import css from './MarkdownTextarea.module.css';

//===================================================================

export type MarkdownTextareaProps = Readonly<{
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
  onValueChange: (value: string) => void;
}>;

//===================================================================

const BLOCK_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'UL', 'OL']);

//===================================================================

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

//===================================================================

function renderInlineMarkdown(value: string): string {
  let html = escapeHtml(value);

  html = html.replace(
    /\[([^\]]+)]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/gi,
    '<a href="$2">$1</a>'
  );
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');

  return html;
}

//===================================================================

function markdownToHtml(markdown: string): string {
  const lines = markdown.replaceAll('\r\n', '\n').split('\n');
  const blocks: string[] = [];

  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1]?.length ?? 1;
      blocks.push(
        `<h${level}>${renderInlineMarkdown(heading[2] ?? '')}</h${level}>`
      );
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index] ?? '')) {
        items.push(
          `<li>${renderInlineMarkdown((lines[index] ?? '').replace(/^[-*]\s+/, ''))}</li>`
        );
        index += 1;
      }
      blocks.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index] ?? '')) {
        items.push(
          `<li>${renderInlineMarkdown((lines[index] ?? '').replace(/^\d+\.\s+/, ''))}</li>`
        );
        index += 1;
      }
      blocks.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    const paragraphLines: string[] = [line];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index] ?? '';
      if (
        !nextLine.trim() ||
        /^(#{1,3})\s+/.test(nextLine) ||
        /^[-*]\s+/.test(nextLine) ||
        /^\d+\.\s+/.test(nextLine)
      ) {
        break;
      }

      paragraphLines.push(nextLine);
      index += 1;
    }

    blocks.push(
      `<p>${paragraphLines.map(renderInlineMarkdown).join('<br>')}</p>`
    );
  }

  return blocks.join('');
}

//===================================================================

function serializeInlineNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as HTMLElement;
  const children = Array.from(element.childNodes)
    .map(serializeInlineNode)
    .join('');

  switch (element.tagName) {
    case 'BR':
      return '\n';
    case 'STRONG':
    case 'B':
      return `**${children}**`;
    case 'EM':
    case 'I':
      return `*${children}*`;
    case 'A': {
      const href = element.getAttribute('href')?.trim();
      return href ? `[${children || href}](${href})` : children;
    }
    default:
      return children;
  }
}

//===================================================================

function serializeList(element: HTMLElement, ordered: boolean): string {
  return Array.from(element.children)
    .filter((child) => child.tagName === 'LI')
    .map((child, index) => {
      const content = Array.from(child.childNodes)
        .map(serializeInlineNode)
        .join('')
        .replace(/\s*\n\s*/g, ' ')
        .trim();

      return `${ordered ? `${index + 1}.` : '-'} ${content}`;
    })
    .join('\n');
}

//===================================================================

function serializeBlockNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as HTMLElement;

  if (element.tagName === 'UL') return `${serializeList(element, false)}\n\n`;
  if (element.tagName === 'OL') return `${serializeList(element, true)}\n\n`;

  const content = Array.from(element.childNodes)
    .map(serializeInlineNode)
    .join('')
    .trim();

  if (element.tagName === 'H1') return `# ${content}\n\n`;
  if (element.tagName === 'H2') return `## ${content}\n\n`;
  if (element.tagName === 'H3') return `### ${content}\n\n`;
  if (element.tagName === 'P' || element.tagName === 'DIV') {
    return `${content}\n\n`;
  }

  return BLOCK_TAGS.has(element.tagName) ? `${content}\n\n` : content;
}

//===================================================================

function editorToMarkdown(editor: HTMLElement): string {
  return Array.from(editor.childNodes)
    .map(serializeBlockNode)
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

//===================================================================

function normalizeLinkUrl(value: string): string | null {
  const rawValue = value.trim();
  if (!rawValue) return null;

  const candidate = /^(?:https?:\/\/|mailto:)/i.test(rawValue)
    ? rawValue
    : `https://${rawValue}`;

  try {
    const url = new URL(candidate);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol)
      ? candidate
      : null;
  } catch {
    return null;
  }
}

//===================================================================

function MarkdownTextarea({
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
  onValueChange,
}: MarkdownTextareaProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const lastEmittedValueRef = useRef<string | null>(null);
  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const hasError = Boolean(isTouched && error);

  const describedBy =
    [hint ? `${id}-hint` : null, hasError ? `${id}-error` : null]
      .filter(Boolean)
      .join(' ') || undefined;

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === lastEmittedValueRef.current) return;

    editor.innerHTML = markdownToHtml(value);
    lastEmittedValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!isLinkEditorOpen) return;

    const frameId = window.requestAnimationFrame(() => {
      linkInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isLinkEditorOpen]);

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    const range = savedRangeRef.current;
    if (!editor) return;

    editor.focus();
    if (!range) return;

    const selection = window.getSelection();
    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(range);
  };

  const emitValue = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const nextValue = editorToMarkdown(editor);

    if (typeof maxLength === 'number' && nextValue.length > maxLength) {
      editor.innerHTML = markdownToHtml(value);
      lastEmittedValueRef.current = value;
      return;
    }

    lastEmittedValueRef.current = nextValue;
    onValueChange(nextValue);
  };

  const runCommand = (command: string, commandValue?: string) => {
    if (disabled) return;

    restoreSelection();
    document.execCommand(command, false, commandValue);
    saveSelection();
    emitValue();
  };

  const openLinkEditor = () => {
    if (disabled) return;

    setLinkUrl('');
    setLinkError('');
    setIsLinkEditorOpen(true);
  };

  const closeLinkEditor = () => {
    setIsLinkEditorOpen(false);
    setLinkUrl('');
    setLinkError('');
    restoreSelection();
  };

  const applyLink = () => {
    if (disabled) return;

    const url = normalizeLinkUrl(linkUrl);
    if (!url) {
      setLinkError('Enter a valid web or email link.');
      return;
    }

    restoreSelection();

    const selection = window.getSelection();
    const isCollapsed =
      !selection || selection.rangeCount === 0 || selection.isCollapsed;

    if (isCollapsed) {
      document.execCommand(
        'insertHTML',
        false,
        `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`
      );
    } else {
      document.execCommand('createLink', false, url);
    }

    setIsLinkEditorOpen(false);
    setLinkUrl('');
    setLinkError('');
    saveSelection();
    emitValue();
  };

  const handlePaste = (event: ReactClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const plainText = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, plainText);
    window.requestAnimationFrame(() => {
      saveSelection();
      emitValue();
    });
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
          <select
            className={css.blockSelect}
            aria-label="Text style"
            defaultValue="p"
            disabled={disabled}
            onMouseDown={saveSelection}
            onChange={(event) => runCommand('formatBlock', event.target.value)}
          >
            <option value="p">Text</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>

          <span className={css.toolbarDivider} aria-hidden="true" />

          <button
            className={css.toolButton}
            type="button"
            disabled={disabled}
            aria-label="Bold"
            title="Bold"
            onMouseDown={saveSelection}
            onClick={() => runCommand('bold')}
          >
            <Bold size={17} aria-hidden="true" />
          </button>

          <button
            className={css.toolButton}
            type="button"
            disabled={disabled}
            aria-label="Italic"
            title="Italic"
            onMouseDown={saveSelection}
            onClick={() => runCommand('italic')}
          >
            <Italic size={17} aria-hidden="true" />
          </button>

          <span className={css.toolbarDivider} aria-hidden="true" />

          <button
            className={css.toolButton}
            type="button"
            disabled={disabled}
            aria-label="Bulleted list"
            title="Bulleted list"
            onMouseDown={saveSelection}
            onClick={() => runCommand('insertUnorderedList')}
          >
            <List size={18} aria-hidden="true" />
          </button>

          <button
            className={css.toolButton}
            type="button"
            disabled={disabled}
            aria-label="Numbered list"
            title="Numbered list"
            onMouseDown={saveSelection}
            onClick={() => runCommand('insertOrderedList')}
          >
            <ListOrdered size={18} aria-hidden="true" />
          </button>

          <button
            className={css.toolButton}
            type="button"
            disabled={disabled}
            aria-label="Add link"
            title="Add link"
            aria-expanded={isLinkEditorOpen}
            onMouseDown={saveSelection}
            onClick={openLinkEditor}
          >
            <Link2 size={17} aria-hidden="true" />
          </button>

          {isLinkEditorOpen ? (
            <div className={css.linkEditor}>
              <div className={css.linkField}>
                <input
                  ref={linkInputRef}
                  className={css.linkInput}
                  type="url"
                  inputMode="url"
                  value={linkUrl}
                  placeholder="https://example.com"
                  aria-label="Link URL"
                  aria-invalid={Boolean(linkError)}
                  onChange={(event) => {
                    setLinkUrl(event.target.value);
                    if (linkError) setLinkError('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      applyLink();
                    }

                    if (event.key === 'Escape') {
                      event.preventDefault();
                      closeLinkEditor();
                    }
                  }}
                />
                {linkError ? (
                  <span className={css.linkError} role="alert">
                    {linkError}
                  </span>
                ) : null}
              </div>

              <div className={css.linkActions}>
                <button
                  className={css.linkActionButton}
                  type="button"
                  onClick={closeLinkEditor}
                >
                  Cancel
                </button>
                <button
                  className={clsx(css.linkActionButton, css.linkApplyButton)}
                  type="button"
                  onClick={applyLink}
                >
                  Add link
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className={css.inputWrap}>
          <div
            ref={editorRef}
            className={css.editable}
            id={id}
            role="textbox"
            aria-label={label}
            aria-multiline="true"
            aria-required={required}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            data-placeholder={placeholder}
            contentEditable={!disabled}
            suppressContentEditableWarning
            spellCheck
            onInput={emitValue}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            onBlur={saveSelection}
            onPaste={handlePaste}
          />

          <input type="hidden" name={name} value={value} />

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

export default MarkdownTextarea;
export { MarkdownTextarea };
