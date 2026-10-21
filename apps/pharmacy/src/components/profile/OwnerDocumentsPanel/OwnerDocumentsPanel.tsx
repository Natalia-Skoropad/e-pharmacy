'use client';

import { useEffect, useState } from 'react';
import { FileBadge2 } from 'lucide-react';

import type { PharmacyOwnerDocument } from '@e-pharmacy/types/pharmacy-owners';
import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';
import { useToast } from '@e-pharmacy/ui/feedback';
import { DocumentsPanel, ProfileResourceState } from '@e-pharmacy/ui/profile';

import {
  PHARMACY_OWNER_DOCUMENT_ACCEPT,
  PHARMACY_OWNER_DOCUMENT_RULES,
} from '@e-pharmacy/validation/files';

import {
  getMyPharmacyOwnerDocument,
  getMyPharmacyOwnerDocuments,
} from '@/lib/api/browser';

//===================================================================

type DocumentsStatus = 'loading' | 'success' | 'error';

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
  const [status, setStatus] = useState<DocumentsStatus>('loading');
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getMyPharmacyOwnerDocuments({ signal: controller.signal })
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

  const handleDownload = async (file: BrowserUploadFile): Promise<string> => {
    if (!file.documentId) return '';

    try {
      return await getMyPharmacyOwnerDocument(file.documentId);
    } catch {
      toast.error('Could not download the document.');
      return '';
    }
  };

  return (
    <DocumentsPanel
      id="pharmacy-owner-documents"
      name="ownerDocuments"
      title="Employee documents"
      description="Review documents attached to your employee account. Documents are managed from the Employees section."
      headerIcon={<FileBadge2 size={22} />}
      value={status === 'success' ? documents.map(toBrowserUploadFile) : []}
      editable={false}
      required
      readOnlyUploadView={status === 'success'}
      disabled={status !== 'success'}
      maxFiles={PHARMACY_OWNER_DOCUMENT_RULES.maxFiles}
      accept={PHARMACY_OWNER_DOCUMENT_ACCEPT}
      hint={`PDF, DOC, DOCX, JPG, PNG, or WEBP. Up to ${PHARMACY_OWNER_DOCUMENT_RULES.maxFiles} files, 10 MB each.`}
      labels={{
        dropzoneTitle: 'Employee documents',
        dropzoneText: 'Documents are managed from the Employees section.',
      }}
      emptyTitle="No documents yet"
      emptyText="No documents are attached to your employee account."
      resourceState={
        status === 'loading' ? (
          <ProfileResourceState
            variant="loading"
            title="Loading employee documents"
            description="Please wait while your documents are loaded."
          />
        ) : status === 'error' ? (
          <ProfileResourceState
            variant="error"
            title="Employee documents could not be loaded"
            description={loadError}
            onRetry={() => {
              setStatus('loading');
              setLoadError('');
              setReloadKey((current) => current + 1);
            }}
          />
        ) : null
      }
      onDownloadFile={handleDownload}
    />
  );
}
