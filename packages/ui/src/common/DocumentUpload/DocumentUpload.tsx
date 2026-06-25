'use client';

import { type ChangeEvent } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';
import clsx from 'clsx';

import css from './DocumentUpload.module.css';

//===================================================================

export type DocumentUploadFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File;
};

//===================================================================

type DocumentUploadProps = {
  id: string;
  name: string;
  label?: string;
  value: DocumentUploadFile[];
  error?: string;
  isTouched?: boolean;
  required?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  hint?: string;
  className?: string;
  onChange: (files: DocumentUploadFile[]) => void;
};

//===================================================================

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

//===================================================================

function createFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
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
  onChange,
}: DocumentUploadProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const limitId = `${id}-limit`;
  const hasError = Boolean(isTouched && error);
  const hasReachedLimit = typeof maxFiles === 'number' && value.length >= maxFiles;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []).map((file) => ({
      id: createFileId(file),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    }));

    const nextFiles = multiple ? [...value, ...selectedFiles] : selectedFiles;
    const uniqueFiles = Array.from(
      new Map(nextFiles.map((file) => [file.id, file])).values()
    );
    const limitedFiles =
      typeof maxFiles === 'number' ? uniqueFiles.slice(0, maxFiles) : uniqueFiles;

    onChange(limitedFiles);
    event.target.value = '';
  };

  const handleRemove = (fileId: string) => {
    onChange(value.filter((file) => file.id !== fileId));
  };

  return (
    <div className={clsx(css.field, className)}>
      <span className={css.label}>
        {label}
        {required ? (
          <span className={css.requiredMark} aria-hidden="true">
            *
          </span>
        ) : null}
      </span>

      <input
        className={css.input}
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled || hasReachedLimit}
        aria-invalid={hasError}
        aria-describedby={`${hintId} ${limitId} ${errorId}`}
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
        <span className={css.title}>Upload pharmacy documents</span>
        <span className={css.text}>PDF, DOC, JPG or PNG files are supported.</span>
      </label>

      {hint ? (
        <p className={css.hint} id={hintId}>
          {hint}
        </p>
      ) : null}

      {typeof maxFiles === 'number' ? (
        <p className={css.limit} id={limitId}>
          {value.length}/{maxFiles} files uploaded
        </p>
      ) : null}

      {value.length > 0 ? (
        <ul className={css.list} aria-label="Uploaded documents">
          {value.map((file) => (
            <li className={css.fileItem} key={file.id}>
              <FileText className={css.fileIcon} size={18} aria-hidden="true" />
              <div className={css.fileMeta}>
                <p className={css.fileName}>{file.name}</p>
                <p className={css.fileSize}>{formatFileSize(file.size)}</p>
              </div>
              <button
                className={css.removeButton}
                type="button"
                disabled={disabled}
                aria-label={`Remove ${file.name}`}
                onClick={() => handleRemove(file.id)}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={css.emptyText}>No documents uploaded yet.</p>
      )}

      <p className={css.error} id={errorId}>
        {isTouched ? (error ?? '') : ''}
      </p>
    </div>
  );
}

export default DocumentUpload;

export { DocumentUpload };
