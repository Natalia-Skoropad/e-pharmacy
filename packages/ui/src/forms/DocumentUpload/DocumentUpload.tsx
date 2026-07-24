'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { Download, FileText, UploadCloud, X } from 'lucide-react';
import clsx from 'clsx';

import type { BrowserUploadFile } from '../types';
import ConfirmationModal from '../../overlays/ConfirmationModal/ConfirmationModal';
import { mergeUploadFileSelection } from './document-upload-selection';

import css from './DocumentUpload.module.css';

//===================================================================

export type DocumentUploadLabels = {
  dropzoneTitle?: string;
  dropzoneText?: string;
  removeAriaLabel?: (fileName: string) => string;
  removeTitle?: string;
  removeText?: (fileName: string) => string;
  removeConfirm?: string;
  removeCancel?: string;
};

export type DocumentUploadProps = {
  id: string;
  name: string;
  label?: string;
  value: BrowserUploadFile[];
  error?: string;
  isTouched?: boolean;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  hint?: string;
  className?: string;
  confirmRemove?: boolean;
  labels?: DocumentUploadLabels;
  onChange: (files: BrowserUploadFile[]) => void;
  validateSelection?: (files: readonly BrowserUploadFile[]) => string;
  onSelectionError?: (message: string) => void;
};

//===================================================================

const DEFAULT_LABELS: Required<DocumentUploadLabels> = {
  dropzoneTitle: 'Upload pharmacy documents',
  dropzoneText: 'PDF, DOC, JPG or PNG files are supported.',
  removeAriaLabel: (fileName) => `Remove ${fileName}`,
  removeTitle: 'Remove document?',
  removeText: (fileName) => `The document “${fileName}” will be removed.`,
  removeConfirm: 'Remove document',
  removeCancel: 'Keep document',
};

//===================================================================

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

//===================================================================

function DocumentUpload({
  id,
  name,
  label = 'Documents',
  value,
  error,
  isTouched,
  required = false,
  disabled = false,
  multiple = true,
  maxFiles,
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
  hint = 'Upload registration documents, license scans, or other files that confirm pharmacy ownership.',
  className,
  confirmRemove = false,
  labels,
  onChange,
  validateSelection,
  onSelectionError,
}: DocumentUploadProps) {
  const [pendingRemoveFileId, setPendingRemoveFileId] = useState<string | null>(
    null
  );

  const mergedLabels = { ...DEFAULT_LABELS, ...labels };
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const limitId = `${id}-limit`;
  const metaId = `${id}-meta`;
  const hasError = Boolean(isTouched && error);
  const describedBy = useMemo(
    () =>
      [hint ? hintId : null, metaId, hasError ? errorId : null]
        .filter(Boolean)
        .join(' '),
    [errorId, hasError, hint, hintId, metaId]
  );

  const hasReachedLimit =
    typeof maxFiles === 'number' && value.length >= maxFiles;

  const pendingRemoveFile =
    value.find((file) => file.id === pendingRemoveFileId) ?? null;

  const removeFile = (fileId: string) => {
    onChange(value.filter((file) => file.id !== fileId));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selection = mergeUploadFileSelection(
      value,
      Array.from(event.target.files ?? []),
      multiple
    );

    event.target.value = '';

    if (typeof maxFiles === 'number' && selection.files.length > maxFiles) {
      onSelectionError?.(`You can upload up to ${maxFiles} files.`);
      return;
    }

    const selectionError = validateSelection?.(selection.files) ?? '';
    if (selectionError) {
      onSelectionError?.(selectionError);
      return;
    }

    if (
      selection.duplicateCount > 0 &&
      selection.files.length === value.length
    ) {
      onSelectionError?.('The selected file is already in the list.');
      return;
    }

    onChange(selection.files);
  };

  const handleRemove = (fileId: string) => {
    if (disabled) return;

    if (confirmRemove) {
      setPendingRemoveFileId(fileId);
      return;
    }

    removeFile(fileId);
  };

  const handleConfirmRemove = () => {
    if (pendingRemoveFileId) removeFile(pendingRemoveFileId);
    setPendingRemoveFileId(null);
  };

  return (
    <div className={clsx(css.field, className)}>
      <label className={css.label} htmlFor={id}>
        {label}
        {required ? (
          <span className={css.requiredMark} aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      <input
        className={css.input}
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled || hasReachedLimit}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy || undefined}
        aria-errormessage={hasError ? errorId : undefined}
        onChange={handleChange}
      />

      <label
        className={clsx(
          css.dropzone,
          (disabled || hasReachedLimit) && css.dropzoneDisabled
        )}
        htmlFor={id}
      >
        <UploadCloud className={css.icon} size={28} aria-hidden="true" />
        <span className={css.title}>{mergedLabels.dropzoneTitle}</span>
        <span className={css.text}>{mergedLabels.dropzoneText}</span>
      </label>

      {hint ? (
        <p className={css.hint} id={hintId}>
          {hint}
        </p>
      ) : null}

      <div className={css.metaRow} id={metaId}>
        {typeof maxFiles === 'number' ? (
          <p className={css.limit} id={limitId}>
            {value.length}/{maxFiles} files uploaded
          </p>
        ) : null}

        <p className={css.error} id={errorId}>
          {isTouched ? (error ?? '') : ''}
        </p>
      </div>

      {value.length > 0 ? (
        <ul className={css.list} aria-label="Uploaded documents">
          {value.map((file) => (
            <li className={css.fileItem} key={file.id}>
              <FileText className={css.fileIcon} size={18} aria-hidden="true" />
              <div className={css.fileMeta}>
                {file.dataUrl ? (
                  <a
                    className={css.fileLink}
                    href={file.dataUrl}
                    download={file.name}
                  >
                    <span className={css.fileName}>{file.name}</span>
                    <Download size={14} aria-hidden="true" />
                  </a>
                ) : (
                  <p className={css.fileName}>{file.name}</p>
                )}
                <p className={css.fileSize}>{formatFileSize(file.size)}</p>
              </div>
              <button
                className={css.removeButton}
                type="button"
                disabled={disabled}
                aria-label={mergedLabels.removeAriaLabel(file.name)}
                onClick={() => handleRemove(file.id)}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {pendingRemoveFile ? (
        <ConfirmationModal
          title={mergedLabels.removeTitle}
          text={mergedLabels.removeText(pendingRemoveFile.name)}
          confirmLabel={mergedLabels.removeConfirm}
          cancelLabel={mergedLabels.removeCancel}
          onConfirm={handleConfirmRemove}
          onCancel={() => setPendingRemoveFileId(null)}
        />
      ) : null}
    </div>
  );
}

export default DocumentUpload;
export { DocumentUpload };
