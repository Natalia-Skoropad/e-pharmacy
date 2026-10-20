'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Files } from 'lucide-react';

import type { PharmacyOwnerDocument } from '@e-pharmacy/types/pharmacy-owners';
import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';
import { useToast } from '@e-pharmacy/ui/feedback';
import { readFileAsDataUrl } from '@e-pharmacy/ui/media';
import { DocumentsPanel, ProfileResourceState } from '@e-pharmacy/ui/profile';

import {
  PHARMACY_OWNER_DOCUMENT_ACCEPT,
  PHARMACY_OWNER_DOCUMENT_RULES,
  normalizePharmacyOwnerDocument,
  validatePharmacyOwnerDocuments,
} from '@e-pharmacy/validation/files';

import {
  deleteMyPharmacyOwnerDocument,
  getMyPharmacyOwnerDocument,
  getMyPharmacyOwnerDocuments,
  uploadMyPharmacyOwnerDocument,
  replaceMyPharmacyOwnerDocument,
} from '@/lib/api/browser';

import { getProfileErrorMessage } from '@/lib/errors/get-profile-error-message';

//===================================================================

type ResourceStatus = 'loading' | 'success' | 'error';

//===================================================================

function toBrowserUploadFile(
  document: PharmacyOwnerDocument
): BrowserUploadFile {
  return {
    id: document.id,
    documentId: document.id,
    name: document.name,
    size: document.size,
    type: document.type,
  };
}

//===================================================================

export function OwnerDocumentsPanel() {
  const toast = useToast();
  const [documents, setDocuments] = useState<PharmacyOwnerDocument[]>([]);
  const [status, setStatus] = useState<ResourceStatus>('loading');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(
    null
  );

  const loadControllerRef = useRef<AbortController | null>(null);

  const loadDocuments = useCallback(async () => {
    loadControllerRef.current?.abort();

    const controller = new AbortController();

    loadControllerRef.current = controller;
    setStatus('loading');
    setError('');

    try {
      const response = await getMyPharmacyOwnerDocuments({
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      setDocuments([...response.documents]);
      setStatus('success');
    } catch (cause) {
      if (controller.signal.aborted) return;

      setError(
        getProfileErrorMessage(cause, 'Could not load owner documents.')
      );

      setStatus('error');
    } finally {
      if (loadControllerRef.current === controller) {
        loadControllerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadControllerRef.current = controller;

    void getMyPharmacyOwnerDocuments({ signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        setDocuments([...response.documents]);
        setStatus('success');
      })

      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;

        setError(
          getProfileErrorMessage(cause, 'Could not load owner documents.')
        );

        setStatus('error');
      })

      .finally(() => {
        if (loadControllerRef.current === controller) {
          loadControllerRef.current = null;
        }
      });

    return () => {
      controller.abort();

      if (loadControllerRef.current === controller) {
        loadControllerRef.current = null;
      }
    };
  }, []);

  const values = useMemo(() => documents.map(toBrowserUploadFile), [documents]);

  const handleUpload = async (files: readonly File[]) => {
    if (isUploading || pendingDocumentId) return;

    setIsUploading(true);

    try {
      for (const file of files) {
        const metadata = normalizePharmacyOwnerDocument(file);
        const rawDataUrl = await readFileAsDataUrl(file);
        const base64Payload = rawDataUrl.slice(rawDataUrl.indexOf(',') + 1);
        const dataUrl = `data:${metadata.type};base64,${base64Payload}`;

        const response = await uploadMyPharmacyOwnerDocument({
          ...metadata,
          dataUrl,
        });

        setDocuments((current) => [response.document, ...current]);
      }

      toast.success(
        files.length === 1
          ? 'Owner document uploaded successfully.'
          : 'Owner documents uploaded successfully.'
      );
    } catch (cause) {
      toast.error(
        getProfileErrorMessage(cause, 'Could not upload owner documents.')
      );

      await loadDocuments();
    } finally {
      setIsUploading(false);
    }
  };

  const handleReplace = async (current: BrowserUploadFile, file: File) => {
    if (!current.documentId || isUploading || pendingDocumentId) return;
    setPendingDocumentId(current.documentId);

    try {
      const metadata = normalizePharmacyOwnerDocument(file);
      const rawDataUrl = await readFileAsDataUrl(file);

      const payload = {
        ...metadata,
        dataUrl: `data:${metadata.type};base64,${rawDataUrl.slice(rawDataUrl.indexOf(',') + 1)}`,
      };

      const response = await replaceMyPharmacyOwnerDocument(
        current.documentId,
        payload
      );

      setDocuments((items) =>
        items.map((item) =>
          item.id === current.documentId ? response.document : item
        )
      );

      toast.success('Owner document replaced successfully.');
    } catch (cause) {
      toast.error(
        getProfileErrorMessage(cause, 'Could not replace owner document.')
      );
      await loadDocuments();
    } finally {
      setPendingDocumentId(null);
    }
  };

  const handleDownload = async (file: BrowserUploadFile): Promise<string> => {
    if (!file.documentId) return '';

    try {
      return await getMyPharmacyOwnerDocument(file.documentId);
    } catch (cause) {
      toast.error(
        getProfileErrorMessage(cause, 'Could not download owner document.')
      );

      return '';
    }
  };

  const handleDelete = async (file: BrowserUploadFile) => {
    if (!file.documentId || isUploading || pendingDocumentId) return;

    setPendingDocumentId(file.documentId);

    try {
      await deleteMyPharmacyOwnerDocument(file.documentId);

      setDocuments((current) =>
        current.filter((document) => document.id !== file.documentId)
      );

      toast.success('Owner document deleted successfully.');
    } catch (cause) {
      toast.error(
        getProfileErrorMessage(cause, 'Could not delete owner document.')
      );
    } finally {
      setPendingDocumentId(null);
    }
  };

  const resourceState =
    status === 'loading' ? (
      <ProfileResourceState
        variant="loading"
        title="Loading owner documents"
        description="Please wait while your owner documents are loaded."
      />
    ) : status === 'error' ? (
      <ProfileResourceState
        variant="error"
        title="Owner documents could not be loaded"
        description={error}
        onRetry={loadDocuments}
      />
    ) : undefined;

  return (
    <DocumentsPanel
      id="pharmacy-owner-documents"
      name="ownerDocuments"
      title="Owner documents"
      required
      description="Private documents that belong to your owner account and stay available across the pharmacies you own."
      headerIcon={<Files size={22} />}
      value={values}
      disabled={
        status !== 'success' || isUploading || Boolean(pendingDocumentId)
      }
      isSaving={isUploading || Boolean(pendingDocumentId)}
      maxFiles={PHARMACY_OWNER_DOCUMENT_RULES.maxFiles}
      accept={PHARMACY_OWNER_DOCUMENT_ACCEPT}
      hint={`PDF, DOC, DOCX, JPG, PNG, or WEBP. Up to ${PHARMACY_OWNER_DOCUMENT_RULES.maxFiles} files, 10 MB each.`}
      validateSelection={validatePharmacyOwnerDocuments}
      onSelectionError={(message) => toast.error(message)}
      onDownloadFile={handleDownload}
      confirmRemove
      labels={{
        dropzoneTitle: 'Upload owner documents',
        dropzoneText: 'PDF, DOC, JPG or PNG files are supported.',
      }}
      canUpload
      canReplace
      canDelete={documents.length > 1}
      onUploadFiles={handleUpload}
      onDeleteFile={handleDelete}
      onReplaceFile={handleReplace}
      pendingDocumentId={pendingDocumentId}
      isUploading={isUploading}
      resourceState={resourceState}
      emptyTitle="No owner documents yet"
      emptyText="At least one owner document is required for pharmacy verification. Upload a new file before replacing or removing the last one."
    />
  );
}
