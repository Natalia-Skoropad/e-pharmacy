'use client';

import { useState, type ChangeEvent, type ReactNode } from 'react';
import { Download, RefreshCw, Save, Trash2, UploadCloud } from 'lucide-react';

import {
  DocumentUpload,
  type DocumentUploadLabels,
} from '../forms/DocumentUpload/DocumentUpload';

import type { BrowserUploadFile } from '../forms/types';
import ConfirmationModal from '../overlays/ConfirmationModal/ConfirmationModal';
import { Button } from '../primitives/Button/Button';

import css from './Profile.module.css';

//===================================================================

export type DocumentsPanelProps = Readonly<{
  id: string;
  name?: string;
  title?: string;
  description?: ReactNode;
  value: BrowserUploadFile[];
  editable?: boolean;
  required?: boolean;
  disabled?: boolean;
  isSaving?: boolean;
  error?: string;
  isTouched?: boolean;
  maxFiles?: number;
  accept?: string;
  hint?: string;
  confirmRemove?: boolean;
  labels?: DocumentUploadLabels;
  submitLabel?: string;
  savingLabel?: string;
  submitDisabled?: boolean;
  emptyTitle?: string;
  emptyText?: string;
  beforeDocuments?: ReactNode;
  onChange?: (files: BrowserUploadFile[]) => void;
  validateSelection?: (files: readonly BrowserUploadFile[]) => string;
  onSelectionError?: (message: string) => void;
  onDownloadFile?: (file: BrowserUploadFile) => Promise<string>;
  onSubmit?: () => Promise<void> | void;

  canUpload?: boolean;
  canReplace?: boolean;
  canDelete?: boolean;
  isUploading?: boolean;
  pendingDocumentId?: string | null;
  onUploadFiles?: (files: readonly File[]) => Promise<void> | void;

  onReplaceFile?: (
    file: BrowserUploadFile,
    replacement: File
  ) => Promise<void> | void;

  onDeleteFile?: (file: BrowserUploadFile) => Promise<void> | void;
}>;

//===================================================================

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

//===================================================================

function toBrowserUploadFile(file: File, index: number): BrowserUploadFile {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
    name: file.name,
    size: file.size,
    type: file.type,
    file,
  };
}

//===================================================================

export function DocumentsPanel({
  id,
  name = 'documents',
  title = 'Documents',
  description,
  value,
  editable = true,
  required = false,
  disabled = false,
  isSaving = false,
  error,
  isTouched,
  maxFiles,
  accept,
  hint,
  confirmRemove = true,
  labels,
  submitLabel = 'Save documents',
  savingLabel = 'Saving...',
  submitDisabled = false,
  emptyTitle = 'No documents yet',
  emptyText = 'Documents will appear here after they are uploaded.',
  beforeDocuments,
  onChange,
  validateSelection,
  onSelectionError,
  onDownloadFile,
  onSubmit,
  canUpload = false,
  canReplace = false,
  canDelete = false,
  isUploading = false,
  pendingDocumentId = null,
  onUploadFiles,
  onReplaceFile,
  onDeleteFile,
}: DocumentsPanelProps) {
  const [pendingDeleteFile, setPendingDeleteFile] =
    useState<BrowserUploadFile | null>(null);

  const canEdit = editable && Boolean(onChange);
  const usesResourceActions = Boolean(
    onUploadFiles || onReplaceFile || onDeleteFile
  );
  const hasReachedLimit =
    typeof maxFiles === 'number' && value.length >= maxFiles;
  const hasPendingResourceMutation = Boolean(pendingDocumentId) || isUploading;

  const handleSubmit = async () => {
    if (!onSubmit || disabled || isSaving || submitDisabled) return;
    await onSubmit();
  };

  const handleDownload = async (file: BrowserUploadFile) => {
    if (!onDownloadFile) return;

    const downloadUrl = await onDownloadFile(file);
    if (!downloadUrl || typeof document === 'undefined') return;

    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = file.name;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleUploadSelection = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (!onUploadFiles || selectedFiles.length === 0) return;

    const incoming = selectedFiles.map(toBrowserUploadFile);
    const nextFiles = [...value, ...incoming];

    if (typeof maxFiles === 'number' && nextFiles.length > maxFiles) {
      onSelectionError?.(`You can upload up to ${maxFiles} files.`);
      return;
    }

    const selectionError = validateSelection?.(nextFiles) ?? '';

    if (selectionError) {
      onSelectionError?.(selectionError);
      return;
    }

    await onUploadFiles(selectedFiles);
  };

  const handleReplaceSelection = async (
    currentFile: BrowserUploadFile,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const replacement = event.target.files?.[0];
    event.target.value = '';

    if (!replacement || !onReplaceFile) return;

    const replacementValue = toBrowserUploadFile(replacement, 0);
    const nextFiles = value.map((file) =>
      file.id === currentFile.id ? replacementValue : file
    );
    const selectionError = validateSelection?.(nextFiles) ?? '';

    if (selectionError) {
      onSelectionError?.(selectionError);
      return;
    }

    await onReplaceFile(currentFile, replacement);
  };

  const handleDelete = async () => {
    if (!pendingDeleteFile || !onDeleteFile) return;

    const target = pendingDeleteFile;
    setPendingDeleteFile(null);
    await onDeleteFile(target);
  };

  const renderDocumentList = () =>
    value.length > 0 ? (
      <ul className={css.documentsList} aria-label="Documents">
        {value.map((file) => {
          const documentId = file.documentId ?? file.id;
          const isPending = pendingDocumentId === documentId;

          return (
            <li className={css.documentItem} key={file.id}>
              <div className={css.documentMeta}>
                <p className={css.documentName}>{file.name}</p>
                <p className={css.documentSize}>{formatFileSize(file.size)}</p>
              </div>

              <div className={css.documentActions}>
                {onDownloadFile ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    iconLeft={<Download size={16} aria-hidden="true" />}
                    disabled={disabled || isPending}
                    onClick={() => void handleDownload(file)}
                  >
                    Download
                  </Button>
                ) : null}

                {usesResourceActions && canReplace && onReplaceFile ? (
                  <label
                    className={css.documentActionLabel}
                    aria-disabled={disabled || hasPendingResourceMutation}
                  >
                    <RefreshCw size={16} aria-hidden="true" />
                    <span>{isPending ? 'Replacing...' : 'Replace'}</span>
                    <input
                      className={css.documentActionInput}
                      type="file"
                      accept={accept}
                      disabled={disabled || hasPendingResourceMutation}
                      aria-label={`Replace ${file.name}`}
                      onChange={(event) =>
                        void handleReplaceSelection(file, event)
                      }
                    />
                  </label>
                ) : null}

                {usesResourceActions && canDelete && onDeleteFile ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    iconLeft={<Trash2 size={16} aria-hidden="true" />}
                    disabled={disabled || hasPendingResourceMutation}
                    onClick={() => setPendingDeleteFile(file)}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    ) : (
      <div className={css.emptyState}>
        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
      </div>
    );

  return (
    <section className={css.panel} aria-labelledby={`${id}-title`}>
      <div className={css.panelHeader}>
        <h2 className={css.panelTitle} id={`${id}-title`}>
          {title}
        </h2>
        {description ? <p className={css.panelText}>{description}</p> : null}
      </div>

      {canEdit && onSubmit ? (
        <Button
          className={css.panelAction}
          type="button"
          iconLeft={<Save size={18} aria-hidden="true" />}
          disabled={disabled || isSaving || submitDisabled}
          isLoading={isSaving}
          loadingLabel={savingLabel}
          onClick={() => void handleSubmit()}
        >
          {submitLabel}
        </Button>
      ) : null}

      <div className={css.panelBody}>
        {beforeDocuments}

        {usesResourceActions && canUpload && onUploadFiles ? (
          <div className={css.documentUploadControls}>
            <label
              className={css.documentUploadLabel}
              aria-disabled={disabled || isUploading || hasReachedLimit}
            >
              <UploadCloud size={18} aria-hidden="true" />
              <span>{isUploading ? 'Uploading...' : 'Upload documents'}</span>
              <input
                className={css.documentActionInput}
                id={id}
                name={name}
                type="file"
                accept={accept}
                multiple
                disabled={disabled || isUploading || hasReachedLimit}
                onChange={(event) => void handleUploadSelection(event)}
              />
            </label>

            {hint ? <p className={css.documentHint}>{hint}</p> : null}
            {error ? (
              <p className={css.formError} role="alert">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}

        {usesResourceActions ? (
          renderDocumentList()
        ) : canEdit && onChange ? (
          <DocumentUpload
            id={id}
            name={name}
            value={value}
            error={error}
            isTouched={isTouched}
            required={required}
            disabled={disabled || isSaving}
            maxFiles={maxFiles}
            accept={accept}
            hint={hint}
            confirmRemove={confirmRemove}
            labels={labels}
            validateSelection={validateSelection}
            onSelectionError={onSelectionError}
            onDownloadFile={onDownloadFile}
            onChange={onChange}
          />
        ) : (
          renderDocumentList()
        )}
      </div>

      {pendingDeleteFile ? (
        <ConfirmationModal
          title="Delete document?"
          text={`The document “${pendingDeleteFile.name}” will be permanently deleted.`}
          confirmLabel="Delete document"
          cancelLabel="Keep document"
          onConfirm={() => void handleDelete()}
          onCancel={() => setPendingDeleteFile(null)}
        />
      ) : null}
    </section>
  );
}
