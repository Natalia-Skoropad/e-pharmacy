'use client';

import { useEffect, useRef, useState } from 'react';

import type { AdminEmployeeDocument } from '@e-pharmacy/types/admin';
import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';
import { useToast } from '@e-pharmacy/ui/feedback';
import { readFileAsDataUrl } from '@e-pharmacy/ui/media';
import { DocumentsPanel } from '@e-pharmacy/ui/profile';
import { Button } from '@e-pharmacy/ui/primitives';

import {
  ADMIN_EMPLOYEE_DOCUMENT_ACCEPT,
  ADMIN_EMPLOYEE_DOCUMENT_RULES,
  normalizeAdminEmployeeDocument,
  validateAdminEmployeeDocuments,
} from '@e-pharmacy/validation/files';

import {
  deleteMyAdminDocument,
  downloadMyAdminDocument,
  getMyAdminDocuments,
  replaceMyAdminDocument,
  uploadMyAdminDocument,
} from '@/lib/api/browser/admin-documents.api';

import css from './AdminDocuments.module.css';

//===================================================================

type DocumentsStatus = 'loading' | 'success' | 'error';

//===================================================================

function toBrowserUploadFile(
  document: AdminEmployeeDocument
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

async function buildUploadPayload(file: File) {
  return {
    ...normalizeAdminEmployeeDocument(file),
    dataUrl: await readFileAsDataUrl(file),
  };
}

//===================================================================

export function AdminDocuments({
  isPlatformOwner,
}: Readonly<{ isPlatformOwner: boolean }>) {
  const toast = useToast();
  const [documents, setDocuments] = useState<AdminEmployeeDocument[]>([]);
  const [status, setStatus] = useState<DocumentsStatus>('loading');
  const [loadError, setLoadError] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(
    null
  );

  const mutationInFlightRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    void getMyAdminDocuments({ signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        setDocuments([...response.documents]);
        setLoadError('');
        setStatus('success');
      })
      .catch(() => {
        if (controller.signal.aborted) return;

        setLoadError('Could not load documents. Please try again.');
        setStatus('error');
      });

    return () => controller.abort();
  }, [reloadKey]);

  const documentValues = documents.map(toBrowserUploadFile);

  const handleRetry = () => {
    setStatus('loading');
    setLoadError('');
    setReloadKey((current) => current + 1);
  };

  const handleUploadFiles = async (files: readonly File[]) => {
    if (!isPlatformOwner || mutationInFlightRef.current || files.length === 0) {
      return;
    }

    mutationInFlightRef.current = true;
    setIsUploading(true);
    setMutationError('');

    try {
      const uploaded: AdminEmployeeDocument[] = [];

      for (const file of files) {
        const response = await uploadMyAdminDocument(
          await buildUploadPayload(file)
        );
        uploaded.push(response.document);
      }

      setDocuments((current) => [...uploaded.reverse(), ...current]);
      toast.success(
        uploaded.length === 1
          ? 'Document was uploaded.'
          : `${uploaded.length} documents were uploaded.`
      );
    } catch {
      setMutationError(
        'Could not finish the document upload. Reload the list before trying again.'
      );
      toast.error('Could not upload the document.');
      setStatus('loading');
      setReloadKey((current) => current + 1);
    } finally {
      mutationInFlightRef.current = false;
      setIsUploading(false);
    }
  };

  const handleReplaceFile = async (
    file: BrowserUploadFile,
    replacement: File
  ) => {
    const documentId = file.documentId;

    if (!isPlatformOwner || !documentId || mutationInFlightRef.current) {
      return;
    }

    mutationInFlightRef.current = true;
    setPendingDocumentId(documentId);
    setMutationError('');

    try {
      const response = await replaceMyAdminDocument(
        documentId,
        await buildUploadPayload(replacement)
      );

      setDocuments((current) =>
        current.map((document) =>
          document.id === documentId ? response.document : document
        )
      );
      toast.success('Document was replaced.');
    } catch {
      setMutationError('Could not replace the document. Please try again.');
      toast.error('Could not replace the document.');
    } finally {
      mutationInFlightRef.current = false;
      setPendingDocumentId(null);
    }
  };

  const handleDeleteFile = async (file: BrowserUploadFile) => {
    const documentId = file.documentId;

    if (!isPlatformOwner || !documentId || mutationInFlightRef.current) {
      return;
    }

    mutationInFlightRef.current = true;
    setPendingDocumentId(documentId);
    setMutationError('');

    try {
      await deleteMyAdminDocument(documentId);
      setDocuments((current) =>
        current.filter((document) => document.id !== documentId)
      );
      toast.success('Document was deleted.');
    } catch {
      setMutationError('Could not delete the document. Please try again.');
      toast.error('Could not delete the document.');
    } finally {
      mutationInFlightRef.current = false;
      setPendingDocumentId(null);
    }
  };

  const handleDownload = async (file: BrowserUploadFile): Promise<string> => {
    if (!file.documentId) return '';

    try {
      return await downloadMyAdminDocument(file.documentId);
    } catch {
      toast.error('Could not download the document.');
      return '';
    }
  };

  const panelError = mutationError || (status === 'error' ? loadError : '');

  return (
    <DocumentsPanel
      id="admin-profile-documents"
      name="documents"
      title="Documents"
      description={
        isPlatformOwner
          ? 'Upload and manage documents attached to your Platform Owner account.'
          : 'Documents attached to your admin account are available for download. Only a Platform Owner can change them.'
      }
      value={status === 'success' ? documentValues : []}
      disabled={
        status !== 'success' || isUploading || pendingDocumentId !== null
      }
      maxFiles={ADMIN_EMPLOYEE_DOCUMENT_RULES.maxFiles}
      accept={ADMIN_EMPLOYEE_DOCUMENT_ACCEPT}
      hint={`PDF, DOC, DOCX, JPG, PNG, or WEBP. Up to ${ADMIN_EMPLOYEE_DOCUMENT_RULES.maxFiles} files, 10 MB each.`}
      error={panelError}
      emptyTitle={
        status === 'loading'
          ? 'Loading documents...'
          : status === 'error'
            ? 'Documents are unavailable'
            : 'No documents yet'
      }
      emptyText={
        status === 'loading'
          ? 'Please wait while your private documents are loaded.'
          : status === 'error'
            ? loadError
            : isPlatformOwner
              ? 'Upload documents that belong to your Admin profile.'
              : 'No documents are attached to your Admin profile.'
      }
      beforeDocuments={
        status === 'error' ? (
          <div className={css.retryRow}>
            <Button type="button" variant="secondary" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        ) : null
      }
      canUpload={isPlatformOwner && status === 'success'}
      canReplace={isPlatformOwner && status === 'success'}
      canDelete={isPlatformOwner && status === 'success'}
      isUploading={isUploading}
      pendingDocumentId={pendingDocumentId}
      validateSelection={(files) => validateAdminEmployeeDocuments(files)}
      onSelectionError={(message) => {
        setMutationError(message);
        toast.error(message);
      }}
      onDownloadFile={handleDownload}
      {...(isPlatformOwner
        ? {
            onUploadFiles: handleUploadFiles,
            onReplaceFile: handleReplaceFile,
            onDeleteFile: handleDeleteFile,
          }
        : {})}
    />
  );
}
