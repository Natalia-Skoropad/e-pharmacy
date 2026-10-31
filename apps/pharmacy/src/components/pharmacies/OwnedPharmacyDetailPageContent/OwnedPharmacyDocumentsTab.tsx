'use client';

import { useEffect, useRef, useState } from 'react';
import { Files, X } from 'lucide-react';

import type { MyPharmacyProfile } from '@e-pharmacy/types/pharmacies';

import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';
import { useToast } from '@e-pharmacy/ui/feedback';
import { DocumentsPanel, ProfileResourceState } from '@e-pharmacy/ui/profile';
import { ModalBase } from '@e-pharmacy/ui/overlays';
import { Button } from '@e-pharmacy/ui/primitives';

import {
  PHARMACY_DOCUMENT_ACCEPT,
  PHARMACY_DOCUMENT_RULES,
} from '@e-pharmacy/validation/files';

import {
  downloadOwnedPharmacyDocument,
  getOwnedPharmacyProfile,
} from '@/lib/api/browser/owned-pharmacy-editor.api';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

type DocumentPreview = Readonly<{
  url: string;
  name: string;
  kind: 'image' | 'pdf';
}>;

//===================================================================

const PREVIEW_TYPES: Readonly<Record<string, DocumentPreview['kind']>> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
};

//===================================================================

function Documents({
  pharmacy,
  pharmacyId,
}: {
  pharmacy: MyPharmacyProfile;
  pharmacyId: string;
}) {
  const toast = useToast();
  const [preview, setPreview] = useState<DocumentPreview | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const downloadsRef = useRef(new Set<AbortController>());
  const urlsRef = useRef(new Set<string>());

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

  const documents = [
    ...pharmacy.documents.map((doc) => ({
      ...doc,
      source: 'published' as const,
    })),

    ...(pharmacy.pendingModeration?.documents ?? []).map((doc) => ({
      ...doc,
      source: 'pending' as const,
    })),
  ];

  const files: BrowserUploadFile[] = documents.map((doc) => ({
    id: doc.id,
    documentId: doc.id,
    name: doc.name,
    size: doc.size,
    type: doc.type,
  }));

  const loadFile = async (documentId: string): Promise<Blob | null> => {
    const controller = new AbortController();

    downloadsRef.current.add(controller);

    try {
      const blob = await downloadOwnedPharmacyDocument(pharmacyId, documentId, {
        signal: controller.signal,
      });

      return controller.signal.aborted ? null : blob;
    } catch {
      if (!controller.signal.aborted)
        toast.error('Could not open the private document. Please try again.');

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

  const openPreview = async (file: BrowserUploadFile) => {
    if (previewLoadingId) return;

    const kind = PREVIEW_TYPES[file.type.toLowerCase()];

    if (!kind) return;

    setPreviewLoadingId(file.id);

    try {
      const blob = await loadFile(file.id);

      if (!blob) return;

      // Prevent browsers from rendering arbitrary HTML/SVG from private uploads.
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

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      urlsRef.current.delete(url);
    }, 60_000);
    return url;
  };

  return (
    <>
      <DocumentsPanel
        id="owned-pharmacy-detail-documents"
        name="pharmacyDocuments"
        title="Pharmacy documents"
        description="Published and submitted documents. Manage them in the pharmacy editor when available."
        headerIcon={<Files size={22} />}
        value={files}
        editable={false}
        readOnlyUploadView
        maxFiles={PHARMACY_DOCUMENT_RULES.maxFiles}
        accept={PHARMACY_DOCUMENT_ACCEPT}
        emptyTitle="No pharmacy documents"
        emptyText="No published or submitted documents for this pharmacy."
        onDownloadFile={downloadFile}
        onPreviewFile={openPreview}
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

//===================================================================

/** Documents use their own scoped resource, just like the Admin documents tab. */
export function DocumentsResource({ pharmacyId }: { pharmacyId: string }) {
  const [version, setVersion] = useState(0);

  const [result, setResult] = useState<Readonly<{
    pharmacyId: string;
    version: number;
    pharmacy: MyPharmacyProfile | null;
    failed: boolean;
  }> | null>(null);

  useEffect(() => {
    let active = true;

    void getOwnedPharmacyProfile(pharmacyId)
      .then(({ pharmacy }) => {
        if (active) setResult({ pharmacyId, version, pharmacy, failed: false });
      })

      .catch(() => {
        if (active)
          setResult({ pharmacyId, version, pharmacy: null, failed: true });
      });

    return () => {
      active = false;
    };
  }, [pharmacyId, version]);

  const current =
    result?.pharmacyId === pharmacyId && result?.version === version
      ? result
      : null;

  return current?.pharmacy ? (
    <Documents pharmacy={current.pharmacy} pharmacyId={pharmacyId} />
  ) : current?.failed ? (
    <ProfileResourceState
      variant="error"
      title="Pharmacy documents could not be loaded"
      description="The private document list is unavailable."
      retryLabel="Retry documents"
      onRetry={() => setVersion((v) => v + 1)}
    />
  ) : (
    <ProfileResourceState
      variant="loading"
      title="Loading pharmacy documents"
      description="Checking the pharmacy’s attached files."
    />
  );
}
