'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Files,
  Clock3,
  Camera,
  CircleHelp,
  Save,
} from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';
import type { MyPharmacyProfile } from '@e-pharmacy/types/pharmacies';
import { useToast } from '@e-pharmacy/ui/feedback';

import {
  NameInput,
  PhoneInput,
  EmailInput,
  CommentInput,
  type BrowserUploadFile,
} from '@e-pharmacy/ui/forms';

import { PageHeader } from '@e-pharmacy/ui/layout';
import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import { PictureCard, readFileAsDataUrl } from '@e-pharmacy/ui/media';

import {
  DocumentsPanel,
  PharmacyAboutFields,
  PharmacyPaymentFields,
  ProfileSectionHeader,
  ProfileResourceState,
} from '@e-pharmacy/ui/profile';

import { Button } from '@e-pharmacy/ui/primitives';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';

import {
  PHARMACY_DOCUMENT_ACCEPT,
  PHARMACY_DOCUMENT_RULES,
  normalizePharmacyDocument,
  validatePharmacyDocuments,
  PICTURE_ACCEPT,
  buildPictureFileError,
  buildPictureUrlError,
} from '@e-pharmacy/validation/files';

import {
  getMyPharmacyOwnerDocuments,
  getOwnedPharmacyMemberships,
} from '@/lib/api/browser';

import {
  createOwnedPharmacyDraft,
  downloadOwnedPharmacyDocument,
  getOwnedPharmacyProfile,
  sendOwnedPharmacyForVerification,
  updateOwnedPharmacyDraft,
  uploadOwnedPharmacyDocument,
} from '@/lib/api/browser/owned-pharmacy-editor.api';

import { getOwnedPharmacyPath } from '@/lib/routes';
import { getProfileErrorMessage } from '@/lib/errors/get-profile-error-message';

import { WorkingHoursInput } from '@/components/profile/WorkingHoursInput';

import {
  PHARMACY_NAME_MAX_LENGTH,
  PHARMACY_SHORT_DESCRIPTION_MAX_LENGTH,
  USER_ADDRESS_MAX_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  PHARMACY_LOCATION_TEXT_MAX_LENGTH,
} from '@e-pharmacy/validation/pharmacy';

import {
  EMPTY_FIELDS,
  NEW_PHARMACY_NAME_MIN_LENGTH,
  EDITOR_TABS,
  REQUIRED_FIELDS,
  buildPharmacyEditorPayload,
  tabHasErrors,
  validatePharmacyEditor,
  valuesFromPharmacy,
  type PharmacyEditorField,
  type PharmacyEditorTab,
  type PharmacyEditorValues,
} from './pharmacy-editor-fields';

import css from './OwnedPharmacyEditor.module.css';

//===================================================================

type EditorErrors = Partial<
  Record<PharmacyEditorField | 'documents' | 'ownerDocuments', string>
>;

type Document = { id: string; name: string; size: number; type: string };

//===================================================================

const FIELD_LABELS: Record<PharmacyEditorField, string> = {
  name: 'Pharmacy name',

  address: 'Address',
  settlement: 'Settlement',
  region: 'Region',

  phone: 'Phone',
  email: 'Email',

  workingHours: 'Working hours',

  imageUrl: 'Image URL',

  description: 'Description',
  shortDescription: 'Short description',

  recipientName: 'Recipient name',
  taxId: 'Tax ID',
  iban: 'IBAN',
  bankName: 'Bank name',
  receiptEmail: 'Receipt email',
  paymentPurpose: 'Payment purpose',
};

//===================================================================

const FIELD_HINTS: Partial<Record<PharmacyEditorField, string>> = {
  name: 'This name appears on your pharmacy page, in search results and in the pharmacy list.',

  shortDescription:
    'Clients see this short introduction near your pharmacy name.',

  phone: 'Clients can use this phone number to contact the pharmacy.',
  email: 'Clients can use this email address to contact the pharmacy.',
  region: 'Helps clients find your pharmacy by region.',
  settlement: 'The city or town shown in the pharmacy address.',
  address: 'The street address clients use to find the pharmacy.',
};

//===================================================================

// Same tab component used by Admin pharmacy details and existing profile pages.
const TAB_ITEMS: TabItem<PharmacyEditorTab>[] = [
  { value: 'data', label: 'Pharmacy data', icon: <Building2 size={17} /> },
  { value: 'about', label: 'About pharmacy', icon: <FileText size={17} /> },
  {
    value: 'payment',
    label: 'Payment details',
    icon: <CreditCard size={17} />,
  },
  {
    value: 'documents',
    label: 'Pharmacy documents',
    icon: <Files size={17} />,
  },
];

//===================================================================

function asBrowserFile(document: Document): BrowserUploadFile {
  return {
    id: document.id,
    documentId: document.id,
    name: document.name,
    size: document.size,
    type: document.type,
  };
}

//===================================================================

function documentIds(documents: readonly Document[]) {
  return documents.map((document) => document.id).join(',');
}

//===================================================================

function serverErrors(cause: unknown): EditorErrors {
  if (!isApiError(cause)) return {};

  const details = cause.details;

  if (
    !details ||
    typeof details !== 'object' ||
    !('missingFields' in details) ||
    !Array.isArray(details.missingFields)
  )
    return {};

  const errors: EditorErrors = {};

  for (const missing of details.missingFields) {
    if (typeof missing !== 'string') continue;

    if (
      missing === 'documents' ||
      missing === 'ownerDocuments' ||
      missing in EMPTY_FIELDS
    ) {
      errors[missing as keyof EditorErrors] =
        `${FIELD_LABELS[missing as PharmacyEditorField] ?? missing} is required`;
    }
  }

  return errors;
}

//===================================================================

export function OwnedPharmacyEditor({
  pharmacyId,
}: Readonly<{ pharmacyId?: string }>) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<PharmacyEditorTab>('data');

  const [values, setValues] = useState<PharmacyEditorValues>({
    ...EMPTY_FIELDS,
  });

  const [savedValues, setSavedValues] = useState<PharmacyEditorValues>({
    ...EMPTY_FIELDS,
  });

  const [documents, setDocuments] = useState<Document[]>([]);
  const [savedDocuments, setSavedDocuments] = useState<Document[]>([]);
  const [revision, setRevision] = useState('');
  const [errors, setErrors] = useState<EditorErrors>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<'save' | 'verify' | 'upload' | null>(null);
  const mutationLock = useRef(false);
  const requestId = useRef<string | null>(null);
  const allowNavigateRef = useRef(false);

  const isDirty =
    !pharmacyId ||
    JSON.stringify(values) !== JSON.stringify(savedValues) ||
    documentIds(documents) !== documentIds(savedDocuments);

  const hydrate = useCallback((pharmacy: MyPharmacyProfile) => {
    const hydrated = valuesFromPharmacy(pharmacy);

    setValues(hydrated);
    setSavedValues(hydrated);
    setDocuments([...pharmacy.documents]);
    setSavedDocuments([...pharmacy.documents]);
    setRevision(pharmacy.updatedAt);
  }, []);

  useEffect(() => {
    if (pharmacyId) return;

    const controller = new AbortController();

    void getOwnedPharmacyMemberships({ signal: controller.signal })
      .then((memberships) => {
        if (controller.signal.aborted) return;

        if (
          memberships.length > 0 &&
          !memberships.some((item) => item.membershipRole === 'owner')
        ) {
          setLoadError('Only pharmacy owners can create a pharmacy.');
        }
      })

      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setLoadError(
            getProfileErrorMessage(cause, 'Could not check pharmacy ownership.')
          );
      })

      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [pharmacyId]);

  useEffect(() => {
    if (!pharmacyId) return;

    let canceled = false;

    void getOwnedPharmacyProfile(pharmacyId)
      .then(({ pharmacy }) => {
        if (canceled) return;

        if (pharmacy.membershipRole !== 'owner' || pharmacy.status !== 'new') {
          setLoadError('This pharmacy is not an editable draft.');
        } else {
          hydrate(pharmacy);
        }
      })

      .catch((cause: unknown) => {
        if (!canceled)
          setLoadError(
            getProfileErrorMessage(cause, 'Could not load the pharmacy draft.')
          );
      })

      .finally(() => {
        if (!canceled) setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [pharmacyId, hydrate]);

  // A route change would unmount the editor tabs. Internal tab switches only
  // update local state, preserving entered values without prompting.
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || allowNavigateRef.current) return;

      event.preventDefault();
      event.returnValue = '';
    };

    const interceptLink = (event: MouseEvent) => {
      if (
        !isDirty ||
        allowNavigateRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;

      const target = event.target;
      const link = target instanceof Element ? target.closest('a[href]') : null;

      if (!link || link.getAttribute('target') === '_blank') return;

      const href = link.getAttribute('href') ?? '';

      if (!href || href.startsWith('#') || href === window.location.pathname)
        return;
      if (
        !window.confirm(
          'You have unsaved pharmacy changes. Leave this page without saving?'
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const editorPath = window.location.pathname;

    const onPopState = () => {
      if (
        isDirty &&
        !allowNavigateRef.current &&
        !window.confirm(
          'You have unsaved pharmacy changes. Leave this page without saving?'
        )
      ) {
        window.history.pushState(null, '', editorPath);
      }
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', interceptLink, true);

    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', interceptLink, true);
    };
  }, [isDirty]);

  const change = (name: PharmacyEditorField, value: string) => {
    setValues((old) => ({ ...old, [name]: value }));
    setErrors((old) => ({ ...old, [name]: undefined }));
  };

  async function saveDraft(): Promise<string | null> {
    if (mutationLock.current) return null;
    if (pharmacyId && !isDirty) return pharmacyId;

    const draftErrors = validatePharmacyEditor(
      values,
      documents.length,
      'draft',
      !pharmacyId
    );

    if (Object.keys(draftErrors).length) {
      setErrors(draftErrors);

      setTab(
        EDITOR_TABS.find((item) => tabHasErrors(item.id, draftErrors))?.id ??
          'data'
      );

      toast.error(
        'Please correct the highlighted fields before saving your draft.'
      );

      return null;
    }

    mutationLock.current = true;
    setBusy('save');

    try {
      const payload = buildPharmacyEditorPayload(
        values,
        pharmacyId ? savedValues : undefined
      );

      let response;

      if (!pharmacyId) {
        // Retain the UUID across failed/retried requests to avoid duplicate drafts.
        requestId.current ??= crypto.randomUUID();

        response = await createOwnedPharmacyDraft({
          ...payload,
          clientRequestId: requestId.current,
        });
      } else {
        response = await updateOwnedPharmacyDraft(pharmacyId, {
          ...payload,

          ...(documentIds(documents) !== documentIds(savedDocuments)
            ? { documents: documents.map((doc) => ({ documentId: doc.id })) }
            : {}),

          expectedRevision: revision,
        });
      }

      hydrate(response.pharmacy);
      toast.success('Pharmacy draft saved.');

      if (!pharmacyId) {
        allowNavigateRef.current = true;
        router.replace(getOwnedPharmacyPath(response.pharmacy.id));
      }

      return response.pharmacy.id;
    } catch (cause) {
      toast.error(
        getProfileErrorMessage(cause, 'Could not save pharmacy draft.')
      );

      return null;
    } finally {
      setBusy(null);
      mutationLock.current = false;
    }
  }

  async function verify() {
    if (mutationLock.current) return;

    const nextErrors = validatePharmacyEditor(values, documents.length);

    // Only an existing, saved draft can be verified; do not create/submit
    // half-finished data or silently discard changes.
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);

      setTab(
        EDITOR_TABS.find((item) => tabHasErrors(item.id, nextErrors))?.id ??
          'data'
      );

      toast.error('Complete the highlighted tabs before verification.');

      return;
    }

    if (isDirty || !pharmacyId) {
      toast.error('Save your draft before sending it for verification.');

      return;
    }

    mutationLock.current = true;
    setBusy('verify');

    try {
      const owner = await getMyPharmacyOwnerDocuments();

      if (!owner.documents.length) {
        setErrors((prev) => ({
          ...prev,
          ownerDocuments: 'Upload Owner documents in your personal profile.',
        }));

        setTab('documents');
        toast.error('Owner documents are required.');

        return;
      }

      await sendOwnedPharmacyForVerification(pharmacyId);

      allowNavigateRef.current = true;
      toast.success('Pharmacy sent for verification.');
      window.location.assign(getOwnedPharmacyPath(pharmacyId));
    } catch (cause) {
      const next = serverErrors(cause);

      if (Object.keys(next).length) {
        setErrors(next);

        setTab(
          EDITOR_TABS.find((item) => tabHasErrors(item.id, next))?.id ?? tab
        );
      }

      toast.error(
        getProfileErrorMessage(
          cause,
          'Could not send pharmacy for verification.'
        )
      );
    } finally {
      setBusy(null);
      mutationLock.current = false;
    }
  }

  async function upload(files: readonly File[]) {
    if (!files.length || !pharmacyId || mutationLock.current) return;

    const incoming = files.map(normalizePharmacyDocument);
    const validation = validatePharmacyDocuments([...documents, ...incoming]);

    if (validation) {
      setErrors((old) => ({ ...old, documents: validation }));
      return;
    }

    mutationLock.current = true;
    setBusy('upload');

    try {
      const uploaded: Document[] = [];

      for (const file of files) {
        const metadata = normalizePharmacyDocument(file);
        const dataUrl = await readFileAsDataUrl(file);

        const response = await uploadOwnedPharmacyDocument(pharmacyId, {
          ...metadata,
          dataUrl,
        });

        uploaded.push(response.document);
      }

      setDocuments((old) => [...old, ...uploaded]);
      setErrors((old) => ({ ...old, documents: undefined }));

      toast.success(
        'Documents uploaded. Use Save draft at the top to attach them.'
      );
    } catch (cause) {
      toast.error(getProfileErrorMessage(cause, 'Could not upload document.'));
    } finally {
      setBusy(null);
      mutationLock.current = false;
    }
  }

  function input(
    name: PharmacyEditorField,
    extra?: { type?: string; maxLength?: number }
  ) {
    const common = {
      id: `pharmacy-${name}`,
      name,
      value: values[name],
      label: FIELD_LABELS[name],

      ...(name === 'name' ? { placeholder: 'Enter pharmacy name' } : {}),

      required:
        REQUIRED_FIELDS.data.includes(name) ||
        REQUIRED_FIELDS.about.includes(name) ||
        REQUIRED_FIELDS.payment.includes(name),

      isTouched: Boolean(fieldError(name)),
      error: fieldError(name),
      disabled: busy !== null,
      maxLength: extra?.maxLength,
      hint: FIELD_HINTS[name],

      onChange: (event: ChangeEvent<HTMLInputElement>) =>
        change(name, event.target.value),
    };

    if (name === 'phone') return <PhoneInput {...common} />;

    if (name === 'email' || name === 'receiptEmail')
      return <EmailInput {...common} />;

    return <NameInput {...common} autoComplete="off" />;
  }

  if (loading)
    return (
      <ProfileResourceState
        variant="loading"
        title="Loading draft"
        description="Loading your saved pharmacy fields."
      />
    );

  if (loadError)
    return (
      <ProfileResourceState
        variant="error"
        title="Draft unavailable"
        description={loadError}
      />
    );

  const hasSavedDraft = Boolean(pharmacyId);

  const visibleTabs = hasSavedDraft
    ? TAB_ITEMS
    : TAB_ITEMS.filter((item) => item.value !== 'documents');

  const draftFieldErrors = validatePharmacyEditor(
    values,
    documents.length,
    'draft',
    !hasSavedDraft
  );

  const fieldError = (name: PharmacyEditorField) =>
    errors[name] ?? (values[name].trim() ? draftFieldErrors[name] : undefined);

  const documentError = errors.documents;

  const canSaveDraft =
    !draftFieldErrors.name &&
    (hasSavedDraft ||
      values.name.trim().length >= NEW_PHARMACY_NAME_MIN_LENGTH);

  return (
    <main className={css.page} aria-labelledby="create-pharmacy-title">
      <section className={css.card}>
        <PageHeader
          className={css.editorHeader}
          title={
            <span className={css.titleWithHelp}>
              {pharmacyId ? 'Edit pharmacy draft' : 'Create pharmacy'}
              <InfoTooltip
                label="How pharmacy registration works"
                title="Creating your pharmacy"
                icon={<CircleHelp size={20} aria-hidden="true" />}
                escapeOverflow
                items={[
                  {
                    title: 'Save draft',
                    description:
                      'Enter a pharmacy name of at least 10 characters to save your draft. You can add the other details later. Any details you enter must be valid.',
                    icon: <Save size={17} aria-hidden="true" />,
                  },
                  {
                    title: 'Add documents',
                    description:
                      'Once your draft is saved, open Pharmacy documents to upload the pharmacy files needed for review. Your personal owner documents belong in your profile.',
                    icon: <Files size={17} aria-hidden="true" />,
                  },
                  {
                    title: 'Send for verification',
                    description:
                      'Complete all pharmacy details, add a photo and working hours, provide payment information, and upload pharmacy and owner documents. Save your changes before sending the pharmacy for review.',
                    icon: <CheckCircle2 size={17} aria-hidden="true" />,
                  },
                ]}
              />
            </span>
          }
          titleId="create-pharmacy-title"
          icon={<Building2 size={23} aria-hidden="true" />}
          actions={
            <div className={css.headerActions}>
              <Button
                variant="secondary"
                iconLeft={<Save size={17} />}
                disabled={
                  busy !== null || !canSaveDraft || (hasSavedDraft && !isDirty)
                }
                isLoading={busy === 'save'}
                onClick={() => void saveDraft()}
              >
                Save draft
              </Button>
              <Button
                iconLeft={<CheckCircle2 size={17} />}
                disabled={busy !== null || !hasSavedDraft || isDirty}
                isLoading={busy === 'verify'}
                onClick={() => void verify()}
              >
                Send for verification
              </Button>
            </div>
          }
        />
      </section>

      <section className={css.card} aria-label="Pharmacy draft details">
        <div className={css.tabStack}>
          <Tabs
            idBase="owned-pharmacy-editor"
            items={visibleTabs}
            ariaLabel="Create pharmacy sections"
            activeValue={tab}
            mobileVisibleCount={1}
            tabletVisibleCount={visibleTabs.length}
            onChange={setTab}
          />
          {tabHasErrors(tab, errors) ? (
            <p className={css.error} role="alert">
              Correct the highlighted fields in this section.
            </p>
          ) : null}
          <section
            id={`owned-pharmacy-editor-panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`owned-pharmacy-editor-tab-${tab}`}
            className={css.tabPanel}
            tabIndex={0}
          >
            {tab === 'data' ? (
              <div className={css.tabContent}>
                <section
                  className={css.profileBlock}
                  aria-label="Pharmacy photo"
                >
                  <ProfileSectionHeader
                    title={
                      <>
                        Pharmacy photo <span className={css.required}>*</span>
                      </>
                    }
                    description="Clients see this photo on your pharmacy page and next to your pharmacy in search results and listings."
                    icon={<Camera size={22} aria-hidden="true" />}
                  />
                  <div className={css.pictureColumn}>
                    <PictureCard
                      compactLayout
                      name={values.name || 'Pharmacy'}
                      pictureUrl={values.imageUrl || null}
                      accept={PICTURE_ACCEPT}
                      disabled={busy !== null}
                      validateFile={(file) =>
                        buildPictureFileError(file) || null
                      }
                      validatePictureUrl={(url) =>
                        buildPictureUrlError(url) || null
                      }
                      onChange={(url) => change('imageUrl', url ?? '')}
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

                <section
                  className={css.profileBlock}
                  aria-label="Working hours"
                >
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
                />
                <PharmacyAboutFields
                  value={values.description}
                  disabled={busy !== null}
                  error={errors.description}
                  isTouched={Boolean(errors.description)}
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
                  errors={errors}
                  touched={{
                    recipientName: Boolean(errors.recipientName),
                    taxId: Boolean(errors.taxId),
                    iban: Boolean(errors.iban),
                    bankName: Boolean(errors.bankName),
                    receiptEmail: Boolean(errors.receiptEmail),
                    paymentPurpose: Boolean(errors.paymentPurpose),
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
                  required
                  value={documents.map(asBrowserFile)}
                  maxFiles={PHARMACY_DOCUMENT_RULES.maxFiles}
                  accept={PHARMACY_DOCUMENT_ACCEPT}
                  hint={`PDF, DOC, DOCX, JPG, PNG or WEBP. Up to ${PHARMACY_DOCUMENT_RULES.maxFiles} files, 10 MB each.`}
                  editable
                  onChange={(selection) => {
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

                    setDocuments((current) =>
                      current.filter((file) => attached.has(file.id))
                    );

                    setErrors((current) => ({
                      ...current,
                      documents: undefined,
                    }));
                  }}
                  validateSelection={(files) =>
                    validatePharmacyDocuments(files)
                  }
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
          </section>
        </div>
      </section>
    </main>
  );
}
