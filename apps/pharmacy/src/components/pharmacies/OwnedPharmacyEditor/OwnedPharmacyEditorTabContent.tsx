'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';

import {
  Building2,
  Camera,
  Clock3,
  CreditCard,
  FileText,
  Files,
} from 'lucide-react';

import { CommentInput, type BrowserUploadFile } from '@e-pharmacy/ui/forms';
import { useToast } from '@e-pharmacy/ui/feedback';
import { PictureCard } from '@e-pharmacy/ui/media';

import {
  DocumentsPanel,
  PharmacyAboutFields,
  PharmacyPaymentFields,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import {
  PHARMACY_DOCUMENT_ACCEPT,
  PHARMACY_DOCUMENT_RULES,
  validatePharmacyDocuments,
  PICTURE_ACCEPT,
  buildPictureFileError,
  buildPictureUrlError,
} from '@e-pharmacy/validation/files';

import {
  PHARMACY_NAME_MAX_LENGTH,
  PHARMACY_SHORT_DESCRIPTION_MAX_LENGTH,
  USER_ADDRESS_MAX_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  PHARMACY_LOCATION_TEXT_MAX_LENGTH,
} from '@e-pharmacy/validation/pharmacy';

import { downloadOwnedPharmacyDocument } from '@/lib/api/browser/owned-pharmacy-editor.api';
import { getProfileErrorMessage } from '@/lib/errors/get-profile-error-message';

import { WorkingHoursInput } from '@/components/profile/WorkingHoursInput';

import type {
  PharmacyEditorField,
  PharmacyEditorTab,
  PharmacyEditorValues,
} from './pharmacy-editor-fields';

import { FIELD_HINTS } from './pharmacy-editor-presentation';
import type { EditorErrors, PharmacyDocument } from './pharmacy-editor-types';

import css from './OwnedPharmacyEditor.module.css';

//===================================================================

function asBrowserFile(document: PharmacyDocument): BrowserUploadFile {
  return {
    id: document.id,
    documentId: document.id,
    name: document.name,
    size: document.size,
    type: document.type,
  };
}

//===================================================================

export type OwnedPharmacyEditorTabContentProps = Readonly<{
  tab: PharmacyEditorTab;
  headerAction?: ReactNode;
  headerActionClassName?: string;
  values: PharmacyEditorValues;
  busy: 'save' | 'verify' | 'upload' | null;
  errors: EditorErrors;
  fieldError: (name: PharmacyEditorField) => string | undefined;

  input: (
    name: PharmacyEditorField,
    extra?: { type?: string; maxLength?: number }
  ) => ReactNode;

  change: (name: PharmacyEditorField, value: string) => void;
  toast: ReturnType<typeof useToast>;
  setErrors: Dispatch<SetStateAction<EditorErrors>>;
  documents: PharmacyDocument[];
  setDocuments: Dispatch<SetStateAction<PharmacyDocument[]>>;
  pharmacyId?: string;
  documentsEditable?: boolean;
  upload: (files: readonly File[]) => Promise<void>;
}>;

//===================================================================

export function OwnedPharmacyEditorTabContent({
  tab,
  headerAction,
  headerActionClassName,
  values,
  busy,
  errors,
  fieldError,
  input,
  change,
  toast,
  setErrors,
  documents,
  setDocuments,
  pharmacyId,
  documentsEditable = true,
  upload,
}: OwnedPharmacyEditorTabContentProps) {
  const documentError = errors.documents;

  return (
    <>
      {tab === 'data' ? (
        <div className={css.tabContent}>
          <section className={css.profileBlock} aria-label="Pharmacy photo">
            <ProfileSectionHeader
              title={
                <>
                  Pharmacy photo <span className={css.required}>*</span>
                </>
              }
              description="Clients see this photo on your pharmacy page and next to your pharmacy in search results and listings."
              icon={<Camera size={22} aria-hidden="true" />}
              action={headerAction}
              actionClassName={headerActionClassName}
            />

            <div className={css.pictureColumn}>
              <PictureCard
                compactLayout
                name={values.name || 'Pharmacy'}
                pictureUrl={values.imageUrl || null}
                accept={PICTURE_ACCEPT}
                disabled={busy !== null}
                validateFile={(file) => buildPictureFileError(file) || null}
                validatePictureUrl={(url) => buildPictureUrlError(url) || null}
                onChange={(url) => {
                  change('imageUrl', url ?? '');

                  toast.success(
                    url ? 'Pharmacy photo updated.' : 'Pharmacy photo removed.'
                  );
                }}
                onError={(message) =>
                  setErrors((current) => ({
                    ...current,
                    imageUrl: message,
                  }))
                }
                labels={{
                  hint: 'Upload a lightweight JPG, PNG, or WEBP photo up to 450 KB. Clients will see it in the pharmacy profile and search results. It will be saved with your draft.',
                }}
              />
              {errors.imageUrl ? (
                <p className={css.error} role="alert">
                  {errors.imageUrl}
                </p>
              ) : null}
            </div>
          </section>

          <section
            className={css.profileBlock}
            aria-label="Pharmacy information"
          >
            <ProfileSectionHeader
              title="Pharmacy information"
              description="Tell clients what your pharmacy is called, how to contact it and where to find it."
              icon={<Building2 size={22} aria-hidden="true" />}
            />

            <div className={css.fieldGroups}>
              <div className={css.fieldGroup}>
                <div className={css.nameFields}>
                  {input('name', { maxLength: PHARMACY_NAME_MAX_LENGTH })}

                  <CommentInput
                    id="pharmacy-short-description"
                    name="shortDescription"
                    label="Short description"
                    placeholder="Briefly describe your pharmacy"
                    hint={FIELD_HINTS.shortDescription}
                    value={values.shortDescription}
                    maxLength={PHARMACY_SHORT_DESCRIPTION_MAX_LENGTH}
                    required
                    disabled={busy !== null}
                    error={fieldError('shortDescription')}
                    isTouched={Boolean(fieldError('shortDescription'))}
                    onChange={(event) =>
                      change('shortDescription', event.target.value)
                    }
                  />
                </div>
              </div>

              <div className={css.fieldGroup}>
                <div className={css.fieldsGrid}>
                  {input('phone', { maxLength: USER_PHONE_MAX_LENGTH })}
                  {input('email', { maxLength: USER_EMAIL_MAX_LENGTH })}
                </div>
              </div>

              <div className={css.fieldGroup}>
                <div className={css.fieldsGrid}>
                  {input('region', {
                    maxLength: PHARMACY_LOCATION_TEXT_MAX_LENGTH,
                  })}

                  {input('settlement', {
                    maxLength: PHARMACY_LOCATION_TEXT_MAX_LENGTH,
                  })}

                  <div className={css.fullWidth}>
                    {input('address', {
                      maxLength: USER_ADDRESS_MAX_LENGTH,
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={css.profileBlock} aria-label="Working hours">
            <ProfileSectionHeader
              title="Working hours"
              description="Let clients know when your pharmacy is open and when they can visit or collect an order."
              icon={<Clock3 size={22} aria-hidden="true" />}
            />

            <WorkingHoursInput
              id="new-pharmacy-working-hours"
              value={values.workingHours}
              onValueChange={(value) => change('workingHours', value)}
              error={fieldError('workingHours')}
              isTouched={Boolean(fieldError('workingHours'))}
              disabled={busy !== null}
              required
            />
          </section>
        </div>
      ) : null}
      {tab === 'about' ? (
        <div className={css.tabContent}>
          <ProfileSectionHeader
            title="About pharmacy"
            description="Tell clients about the pharmacy, services and pickup information."
            icon={<FileText size={22} aria-hidden="true" />}
            action={headerAction}
          />

          <PharmacyAboutFields
            value={values.description}
            disabled={busy !== null}
            error={fieldError('description')}
            isTouched={Boolean(fieldError('description'))}
            onChange={(value) => change('description', value)}
          />
        </div>
      ) : null}
      {tab === 'payment' ? (
        <div className={css.tabContent}>
          <ProfileSectionHeader
            title="Payment details"
            description="Payment information used for pharmacy orders."
            icon={<CreditCard size={22} aria-hidden="true" />}
            action={headerAction}
          />

          <PharmacyPaymentFields
            values={{
              recipientName: values.recipientName,
              taxId: values.taxId,
              iban: values.iban,
              bankName: values.bankName,
              receiptEmail: values.receiptEmail,
              paymentPurpose: values.paymentPurpose,
            }}
            errors={{
              recipientName: fieldError('recipientName'),
              taxId: fieldError('taxId'),
              iban: fieldError('iban'),
              bankName: fieldError('bankName'),
              receiptEmail: fieldError('receiptEmail'),
              paymentPurpose: fieldError('paymentPurpose'),
            }}
            touched={{
              recipientName: Boolean(fieldError('recipientName')),
              taxId: Boolean(fieldError('taxId')),
              iban: Boolean(fieldError('iban')),
              bankName: Boolean(fieldError('bankName')),
              receiptEmail: Boolean(fieldError('receiptEmail')),
              paymentPurpose: Boolean(fieldError('paymentPurpose')),
            }}
            disabled={busy !== null}
            onChange={(name, value) => change(name, value)}
          />
        </div>
      ) : null}
      {tab === 'documents' ? (
        <div className={css.tabContent}>
          <DocumentsPanel
            id="owned-pharmacy-documents"
            name="pharmacyDocuments"
            title="Pharmacy documents"
            description="Upload the pharmacy documents needed for verification."
            headerIcon={<Files size={22} aria-hidden="true" />}
            headerAction={headerAction}
            required
            value={documents.map(asBrowserFile)}
            maxFiles={PHARMACY_DOCUMENT_RULES.maxFiles}
            accept={PHARMACY_DOCUMENT_ACCEPT}
            hint={`PDF, DOC, DOCX, JPG, PNG or WEBP. Up to ${PHARMACY_DOCUMENT_RULES.maxFiles} files, 10 MB each.`}
            editable={documentsEditable}
            onChange={(selection) => {
              if (!documentsEditable) return;

              const incoming = selection.flatMap((file) =>
                file.file ? [file.file] : []
              );

              if (incoming.length) {
                void upload(incoming);
                return;
              }

              const attached = new Set(
                selection.map((file) => file.documentId)
              );

              if (documents.some((file) => !attached.has(file.id))) {
                toast.success(
                  'Document removed from selection. Save changes to confirm.'
                );
              }

              setDocuments((current) =>
                current.filter((file) => attached.has(file.id))
              );

              setErrors((current) => ({
                ...current,
                documents: undefined,
              }));
            }}
            validateSelection={(files) => validatePharmacyDocuments(files)}
            onSelectionError={(message) =>
              setErrors((current) => ({ ...current, documents: message }))
            }
            onDownloadFile={async (file) => {
              if (!pharmacyId || !file.documentId) return '';

              try {
                const blob = await downloadOwnedPharmacyDocument(
                  pharmacyId,
                  file.documentId
                );

                const url = URL.createObjectURL(blob);

                window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

                return url;
              } catch (cause) {
                toast.error(
                  getProfileErrorMessage(
                    cause,
                    'Could not download pharmacy document.'
                  )
                );
                return '';
              }
            }}
            error={documentError}
            isTouched={Boolean(documentError)}
            disabled={busy !== null}
            isSaving={busy === 'upload'}
            labels={{
              dropzoneTitle: 'Pharmacy documents',
              dropzoneText: 'Documents required before verification.',
            }}
          />
          {errors.ownerDocuments ? (
            <p className={css.error} role="alert">
              {errors.ownerDocuments}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
