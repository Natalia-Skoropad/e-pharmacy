'use client';

import { useEffect, useMemo, useState } from 'react';
import { Files } from 'lucide-react';

import type { PharmacyOwnerDocument } from '@e-pharmacy/types/pharmacy-owners';
import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';
import { useToast } from '@e-pharmacy/ui/feedback';
import { DocumentsPanel, ProfileResourceState } from '@e-pharmacy/ui/profile';

import {
  PHARMACY_OWNER_DOCUMENT_ACCEPT,
  PHARMACY_OWNER_DOCUMENT_RULES,
} from '@e-pharmacy/validation/files';

import {
  downloadAdminPharmacyOwnerDocument,
  getAdminPharmacyOwnerDocuments,
} from '@/lib/api/browser/admin-pharmacy-owners.api';

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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Downloaded document could not be read.'));
    });

    reader.addEventListener('error', () => {
      reject(
        reader.error ?? new Error('Downloaded document could not be read.')
      );
    });

    reader.readAsDataURL(blob);
  });
}

//===================================================================

type OwnerDocumentsTabProps = Readonly<{
  ownerId: string;
  onCountChange?: (count: number) => void;
}>;

//===================================================================

export function OwnerDocumentsTab({
  ownerId,
  onCountChange,
}: OwnerDocumentsTabProps) {
  const toast = useToast();
  const [documents, setDocuments] = useState<PharmacyOwnerDocument[]>([]);
  const [loadedOwnerId, setLoadedOwnerId] = useState<string | null>(null);
  const [status, setStatus] = useState<ResourceStatus>('loading');
  const [loadError, setLoadError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);

  const effectiveStatus: ResourceStatus =
    loadedOwnerId === ownerId ? status : 'loading';

  useEffect(() => {
    const controller = new AbortController();

    void getAdminPharmacyOwnerDocuments(ownerId, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        const nextDocuments = [...response.documents];
        setDocuments(nextDocuments);
        setLoadedOwnerId(ownerId);
        onCountChange?.(nextDocuments.length);
        setLoadError('');
        setStatus('success');
      })

      .catch(() => {
        if (controller.signal.aborted) return;
        setLoadedOwnerId(ownerId);
        setLoadError('Could not load owner documents. Please try again.');
        setStatus('error');
      });

    return () => controller.abort();
  }, [onCountChange, ownerId, reloadVersion]);

  const retryDocuments = () => {
    setStatus('loading');
    setLoadError('');
    setReloadVersion((value) => value + 1);
  };

  const values = useMemo(() => documents.map(toBrowserUploadFile), [documents]);

  const handleDownload = async (file: BrowserUploadFile): Promise<string> => {
    if (!file.documentId) return '';

    try {
      const blob = await downloadAdminPharmacyOwnerDocument(
        ownerId,
        file.documentId
      );

      return await blobToDataUrl(blob);
    } catch {
      toast.error('Could not download the owner document. Please try again.');
      return '';
    }
  };

  return (
    <DocumentsPanel
      id="admin-pharmacy-owner-documents"
      name="ownerDocuments"
      title="Owner documents"
      description="Documents uploaded by the pharmacy owner. Admin access is read-only: you can review and download files, but only the owner can add or remove them."
      headerIcon={<Files size={22} />}
      value={effectiveStatus === 'success' ? values : []}
      editable={false}
      readOnlyUploadView={effectiveStatus === 'success'}
      disabled={effectiveStatus !== 'success'}
      maxFiles={PHARMACY_OWNER_DOCUMENT_RULES.maxFiles}
      accept={PHARMACY_OWNER_DOCUMENT_ACCEPT}
      hint={`PDF, DOC, DOCX, JPG, PNG, or WEBP. Up to ${PHARMACY_OWNER_DOCUMENT_RULES.maxFiles} files, 10 MB each.`}
      labels={{
        dropzoneTitle: 'Owner documents',
        dropzoneText: 'Documents are managed by the pharmacy owner.',
      }}
      emptyTitle="No owner documents yet"
      emptyText="This pharmacy owner has not uploaded any documents yet."
      resourceState={
        effectiveStatus === 'loading' ? (
          <ProfileResourceState
            variant="loading"
            title="Loading owner documents"
            description="Please wait while the owner documents are loaded."
          />
        ) : effectiveStatus === 'error' ? (
          <ProfileResourceState
            variant="error"
            title="Owner documents could not be loaded"
            description={loadError}
            retryLabel="Retry documents"
            onRetry={retryDocuments}
          />
        ) : null
      }
      onDownloadFile={handleDownload}
    />
  );
}
