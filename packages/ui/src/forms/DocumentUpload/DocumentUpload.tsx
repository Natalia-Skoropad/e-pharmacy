'use client';

import { useMemo, useState, type ChangeEvent } from 'react';

import {
  Download,
  Files,
  FileText,
  Eye,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';

import clsx from 'clsx';

import type { BrowserUploadFile } from '../types';

import ConfirmationModal from '../../overlays/ConfirmationModal/ConfirmationModal';
import { mergeUploadFileSelection } from './document-upload-selection';

import { DocumentUploadErrorNotice } from './DocumentUploadErrorNotice';
import { useDocumentUploadFeedback } from './useDocumentUploadFeedback';

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

//===================================================================

export type DocumentUploadProps = {
  id: string;
  name: string;
  label?: string;
  value: BrowserUploadFile[];
  error?: string;
  isTouched?: boolean;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
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
  onDownloadFile?: (file: BrowserUploadFile) => Promise<string>;
  onPreviewFile?: (file: BrowserUploadFile) => Promise<void> | void;
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

const PREVIEWABLE_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

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
  readOnly = false,
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
  onDownloadFile,
  onPreviewFile,
}: DocumentUploadProps) {
  const [pendingRemoveFileId, setPendingRemoveFileId] = useState<string | null>(
    null
  );

  const { selectionError, rejectSelection, clearSelectionError } =
    useDocumentUploadFeedback(onSelectionError);

  const mergedLabels = { ...DEFAULT_LABELS, ...labels };
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const limitId = `${id}-limit`;
  const visibleError = selectionError || (isTouched ? error : '') || '';
  const hasError = Boolean(visibleError);

  const describedBy = useMemo(
    () =>
      [
        hint ? hintId : null,
        typeof maxFiles === 'number' ? limitId : null,
        hasError ? errorId : null,
      ]
        .filter(Boolean)
        .join(' '),

    [errorId, hasError, hint, hintId, limitId, maxFiles]
  );

  const hasReachedLimit =
    typeof maxFiles === 'number' && value.length >= maxFiles;

  const pendingRemoveFile =
    value.find((file) => file.id === pendingRemoveFileId) ?? null;

  const removeFile = (fileId: string) => {
    clearSelectionError();
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
      rejectSelection(`You can upload up to ${maxFiles} files.`);
      return;
    }

    const selectionError = validateSelection?.(selection.files) ?? '';

    if (selectionError) {
      rejectSelection(selectionError);
      return;
    }

    if (
      selection.duplicateCount > 0 &&
      selection.files.length === value.length
    ) {
      rejectSelection('The selected file is already in the list.');
      return;
    }

    clearSelectionError();
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

  const handleDownload = async (file: BrowserUploadFile) => {
    let downloadUrl = file.dataUrl ?? '';
    let objectUrl = '';

    if (!downloadUrl && file.file) {
      objectUrl = URL.createObjectURL(file.file);
      downloadUrl = objectUrl;
    }

    if (!downloadUrl && onDownloadFile) {
      downloadUrl = await onDownloadFile(file);
    }

    if (!downloadUrl) return;

    const anchor = document.createElement('a');

    anchor.href = downloadUrl;
    anchor.download = file.name;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    if (objectUrl) {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    }
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
        disabled={disabled || readOnly || hasReachedLimit}
        aria-required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy || undefined}
        aria-errormessage={hasError ? errorId : undefined}
        onChange={handleChange}
      />

      <label
        className={clsx(
          css.dropzone,
          (disabled || hasReachedLimit) && css.dropzoneDisabled,
          readOnly && css.dropzoneReadOnly
        )}
        htmlFor={readOnly ? undefined : id}
        aria-disabled={readOnly || disabled || hasReachedLimit || undefined}
      >
        <UploadCloud className={css.icon} size={28} aria-hidden="true" />
        <span className={css.title}>{mergedLabels.dropzoneTitle}</span>
        <span className={css.text} id={hint ? hintId : undefined}>
          {hint || mergedLabels.dropzoneText}
        </span>

        {typeof maxFiles === 'number' ? (
          <span className={css.limit} id={limitId} role="status">
            <span className={css.limitLabel}>
              <Files size={16} aria-hidden="true" />
              <strong>
                {value.length} / {maxFiles}
              </strong>{' '}
              files uploaded
            </span>

            <span className={css.limitTrack} aria-hidden="true">
              <span
                className={css.limitProgress}
                style={{
                  width: `${Math.min(100, (value.length / Math.max(1, maxFiles)) * 100)}%`,
                }}
              />
            </span>
          </span>
        ) : null}
      </label>

      {hasError ? (
        <DocumentUploadErrorNotice id={errorId} message={visibleError} />
      ) : null}

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
                ) : file.file || onDownloadFile ? (
                  <button
                    className={css.fileLink}
                    type="button"
                    aria-label={`Download ${file.name}`}
                    onClick={() => void handleDownload(file)}
                  >
                    <span className={css.fileName}>{file.name}</span>
                    <Download size={14} aria-hidden="true" />
                  </button>
                ) : (
                  <p className={css.fileName}>{file.name}</p>
                )}
                <p className={css.fileSize}>{formatFileSize(file.size)}</p>
              </div>
              {onPreviewFile &&
              PREVIEWABLE_DOCUMENT_TYPES.has(file.type.toLowerCase()) ? (
                <button
                  className={css.previewButton}
                  type="button"
                  disabled={disabled}
                  aria-label={`Preview ${file.name}`}
                  onClick={() => void onPreviewFile(file)}
                >
                  <Eye size={16} aria-hidden="true" />
                </button>
              ) : null}
              {!readOnly ? (
                <button
                  className={css.removeButton}
                  type="button"
                  disabled={disabled}
                  aria-label={mergedLabels.removeAriaLabel(file.name)}
                  onClick={() => handleRemove(file.id)}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {pendingRemoveFile ? (
        <ConfirmationModal
          title={mergedLabels.removeTitle}
          eyebrow="Documents"
          text={mergedLabels.removeText(pendingRemoveFile.name)}
          confirmLabel={mergedLabels.removeConfirm}
          cancelLabel={mergedLabels.removeCancel}
          destructive
          confirmIconLeft={<Trash2 size={17} aria-hidden="true" />}
          cancelIconLeft={<X size={17} aria-hidden="true" />}
          onConfirm={handleConfirmRemove}
          onCancel={() => setPendingRemoveFileId(null)}
        />
      ) : null}
    </div>
  );
}

export default DocumentUpload;
export { DocumentUpload };
