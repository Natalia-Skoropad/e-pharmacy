'use client';

import type { ReactNode } from 'react';
import { Download, Save } from 'lucide-react';

import {
  DocumentUpload,
  type DocumentUploadLabels,
} from '../forms/DocumentUpload/DocumentUpload';

import type { BrowserUploadFile } from '../forms/types';
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
}>;

//===================================================================

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
}: DocumentsPanelProps) {
  const canEdit = editable && Boolean(onChange);

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

        {canEdit && onChange ? (
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
        ) : value.length > 0 ? (
          <ul className={css.documentsList} aria-label="Documents">
            {value.map((file) => (
              <li className={css.documentItem} key={file.id}>
                <div className={css.documentMeta}>
                  <p className={css.documentName}>{file.name}</p>
                  <p className={css.documentSize}>
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {onDownloadFile ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    iconLeft={<Download size={16} aria-hidden="true" />}
                    onClick={() => void handleDownload(file)}
                  >
                    Download
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className={css.emptyState}>
            <h3>{emptyTitle}</h3>
            <p>{emptyText}</p>
          </div>
        )}
      </div>
    </section>
  );
}
