'use client';

import { useEffect, useState } from 'react';

import type { AdminEmployeeDocument } from '@e-pharmacy/types/admin';
import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';
import { useToast } from '@e-pharmacy/ui/feedback';
import { DocumentsPanel } from '@e-pharmacy/ui/profile';
import { Button } from '@e-pharmacy/ui/primitives';

import {
  ADMIN_EMPLOYEE_DOCUMENT_ACCEPT,
  ADMIN_EMPLOYEE_DOCUMENT_RULES,
} from '@e-pharmacy/validation/files';

import {
  downloadMyAdminDocument,
  getMyAdminDocuments,
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

export function AdminDocuments() {
  const toast = useToast();
  const [documents, setDocuments] = useState<AdminEmployeeDocument[]>([]);
  const [status, setStatus] = useState<DocumentsStatus>('loading');
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

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

  const handleDownload = async (file: BrowserUploadFile): Promise<string> => {
    if (!file.documentId) return '';

    try {
      return await downloadMyAdminDocument(file.documentId);
    } catch {
      toast.error('Could not download the document.');
      return '';
    }
  };

  return (
    <DocumentsPanel
      id="admin-profile-documents"
      name="documents"
      title="Registration documents"
      description="Review documents attached to your employee account. Documents are managed from the Employees section."
      value={status === 'success' ? documents.map(toBrowserUploadFile) : []}
      editable={false}
      readOnlyUploadView={status === 'success'}
      disabled={status !== 'success'}
      maxFiles={ADMIN_EMPLOYEE_DOCUMENT_RULES.maxFiles}
      accept={ADMIN_EMPLOYEE_DOCUMENT_ACCEPT}
      hint={`PDF, DOC, DOCX, JPG, PNG, or WEBP. Up to ${ADMIN_EMPLOYEE_DOCUMENT_RULES.maxFiles} files, 10 MB each.`}
      labels={{
        dropzoneTitle: 'Registration documents',
        dropzoneText: 'Documents are managed from the Employees section.',
      }}
      error={status === 'error' ? loadError : ''}
      emptyTitle={
        status === 'loading'
          ? 'Loading documents...'
          : status === 'error'
            ? 'Documents are unavailable'
            : 'No documents yet'
      }
      emptyText={
        status === 'loading'
          ? 'Please wait while your documents are loaded.'
          : status === 'error'
            ? loadError
            : 'No documents are attached to your employee account.'
      }
      beforeDocuments={
        status === 'error' ? (
          <div className={css.retryRow}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStatus('loading');
                setLoadError('');
                setReloadKey((current) => current + 1);
              }}
            >
              Retry
            </Button>
          </div>
        ) : null
      }
      onDownloadFile={handleDownload}
    />
  );
}
