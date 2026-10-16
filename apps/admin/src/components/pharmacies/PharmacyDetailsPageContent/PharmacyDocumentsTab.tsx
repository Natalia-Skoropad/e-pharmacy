'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Files, X } from 'lucide-react';

import type { AdminPharmacyDocument } from '@e-pharmacy/types/admin';
import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';
import { useToast } from '@e-pharmacy/ui/feedback';
import { ModalBase } from '@e-pharmacy/ui/overlays';
import { DocumentsPanel, ProfileResourceState } from '@e-pharmacy/ui/profile';
import { Button } from '@e-pharmacy/ui/primitives';
import { formatDateTime } from '@e-pharmacy/utils/date';

import {
  PHARMACY_DOCUMENT_ACCEPT,
  PHARMACY_DOCUMENT_RULES,
} from '@e-pharmacy/validation/files';

import {
  downloadAdminPharmacyDocument,
  getAdminPharmacyDocuments,
} from '@/lib/api/browser/admin-pharmacy-detail.api';

import css from './PharmacyResourceTabs.module.css';

//===================================================================

type ResourceStatus = 'loading' | 'success' | 'error';
type Preview = Readonly<{ url: string; name: string; kind: 'image' | 'pdf' }>;

//===================================================================

const PREVIEW_TYPES: Readonly<Record<string, Preview['kind']>> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
};

//===================================================================

function toUploadFile(file: AdminPharmacyDocument): BrowserUploadFile {
  return {
    id: file.id,
    documentId: file.id,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

//===================================================================

type PharmacyDocumentsTabProps = Readonly<{ pharmacyId: string }>;

//===================================================================

/** Fetches only when its tab is mounted; no pharmacy-owner document API. */
export function PharmacyDocumentsTab({
  pharmacyId,
}: PharmacyDocumentsTabProps) {
  const toast = useToast();

  const [documents, setDocuments] = useState<readonly AdminPharmacyDocument[]>(
    []
  );

  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [status, setStatus] = useState<ResourceStatus>('loading');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const downloadsRef = useRef(new Set<AbortController>());
  const urlsRef = useRef(new Set<string>());

  useEffect(() => {
    const controller = new AbortController();

    void getAdminPharmacyDocuments(pharmacyId, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setDocuments(result.documents);
        setLoadedId(pharmacyId);
        setStatus('success');
      })

      .catch(() => {
        if (controller.signal.aborted) return;
        setLoadedId(pharmacyId);
        setStatus('error');
      });

    return () => controller.abort();
  }, [pharmacyId, reloadVersion]);

  useEffect(() => {
    const requests = downloadsRef.current;
    const urls = urlsRef.current;

    return () => {
      for (const controller of requests) controller.abort();
      for (const url of urls) URL.revokeObjectURL(url);

      requests.clear();
      urls.clear();
    };
  }, [pharmacyId]);

  const effectiveStatus = loadedId === pharmacyId ? status : 'loading';
  const files = useMemo(() => documents.map(toUploadFile), [documents]);

  const loadFile = async (documentId: string): Promise<Blob | null> => {
    const controller = new AbortController();
    downloadsRef.current.add(controller);

    try {
      const blob = await downloadAdminPharmacyDocument(pharmacyId, documentId, {
        signal: controller.signal,
      });

      return controller.signal.aborted ? null : blob;
    } catch {
      if (!controller.signal.aborted) {
        toast.error('Could not open the private document. Please try again.');
      }

      return null;
    } finally {
      downloadsRef.current.delete(controller);
    }
  };

  const registerUrl = (blob: Blob): string => {
    const url = URL.createObjectURL(blob);
    urlsRef.current.add(url);

    return url;
  };

  const closePreview = () => {
    setPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current.url);
        urlsRef.current.delete(current.url);
      }

      return null;
    });
  };

  const openPreview = async (file: AdminPharmacyDocument) => {
    if (previewLoadingId || !PREVIEW_TYPES[file.type.toLowerCase()]) return;
    setPreviewLoadingId(file.id);

    try {
      const blob = await loadFile(file.id);
      if (!blob) return;

      const kind = PREVIEW_TYPES[file.type.toLowerCase()];
      if (!kind) return;

      // Pin the MIME to a safe preview type; never render HTML/SVG uploads.
      const url = registerUrl(
        new Blob([blob], { type: file.type.toLowerCase() })
      );

      closePreview();
      setPreview({ url, name: file.name, kind });
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const downloadFile = async (file: BrowserUploadFile): Promise<string> => {
    if (!file.documentId) return '';
    const blob = await loadFile(file.documentId);

    if (!blob) return '';
    const url = registerUrl(blob);

    // The shared download control consumes this URL immediately. Retire it
    // even when the user keeps the tab mounted for a long editing session.
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      urlsRef.current.delete(url);
    }, 60_000);

    return url;
  };

  return (
    <>
      <DocumentsPanel
        id="admin-pharmacy-documents"
        name="pharmacyDocuments"
        title="Pharmacy documents"
        description="Published and submitted pharmacy verification files. Admin access is read-only; only the pharmacy can manage these documents."
        headerIcon={<Files size={22} />}
        value={effectiveStatus === 'success' ? files : []}
        editable={false}
        readOnlyUploadView={effectiveStatus === 'success'}
        disabled={effectiveStatus !== 'success'}
        maxFiles={PHARMACY_DOCUMENT_RULES.maxFiles}
        accept={PHARMACY_DOCUMENT_ACCEPT}
        labels={{
          dropzoneTitle: 'Pharmacy documents',
          dropzoneText: 'Documents are managed by the pharmacy, not Admin.',
        }}
        hint={`PDF, DOC, DOCX, JPG, PNG or WEBP. Up to ${PHARMACY_DOCUMENT_RULES.maxFiles} files; Admin access is read-only.`}
        emptyTitle="No pharmacy documents"
        emptyText="There are no attached published or pending documents for this pharmacy."
        resourceState={
          effectiveStatus === 'loading' ? (
            <ProfileResourceState
              variant="loading"
              title="Loading pharmacy documents"
              description="Checking the pharmacy’s attached files."
            />
          ) : effectiveStatus === 'error' ? (
            <ProfileResourceState
              variant="error"
              title="Pharmacy documents could not be loaded"
              description="The private document list is unavailable."
              retryLabel="Retry documents"
              onRetry={() => {
                setStatus('loading');
                setReloadVersion((value) => value + 1);
              }}
            />
          ) : null
        }
        beforeDocuments={
          effectiveStatus === 'success' && documents.length ? (
            <ul
              className={css.documentDetails}
              aria-label="Document sources and preview"
            >
              {documents.map((file) => (
                <li key={file.id} className={css.documentDetail}>
                  <div className={css.documentText}>
                    <strong>{file.name}</strong>
                    <span>
                      {file.source === 'pending'
                        ? 'Submitted changes'
                        : 'Published'}
                      {' · '}
                      {file.type}
                      {' · '}
                      {formatDateTime(file.uploadedAt) ?? '—'}
                    </span>
                  </div>
                  {PREVIEW_TYPES[file.type.toLowerCase()] ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      iconLeft={<Eye size={16} aria-hidden="true" />}
                      disabled={Boolean(previewLoadingId)}
                      isLoading={previewLoadingId === file.id}
                      onClick={() => void openPreview(file)}
                    >
                      Preview
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null
        }
        onDownloadFile={downloadFile}
      />

      <ModalBase
        isOpen={Boolean(preview)}
        ariaLabel={preview ? `Preview ${preview.name}` : 'Document preview'}
        onClose={closePreview}
        dialogClassName={css.previewDialog}
      >
        {preview ? (
          <div className={css.previewContent}>
            <div className={css.previewHeader}>
              <strong>{preview.name}</strong>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={closePreview}
              >
                <X size={18} aria-hidden="true" /> Close
              </Button>
            </div>
            {preview.kind === 'image' ? (
              // Blob URLs are local, created only from privately fetched safe image files.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt={preview.name}
                className={css.previewImage}
              />
            ) : (
              <iframe
                title={`PDF preview of ${preview.name}`}
                src={preview.url}
                sandbox="allow-scripts"
                className={css.previewFrame}
              />
            )}
          </div>
        ) : null}
      </ModalBase>
    </>
  );
}
