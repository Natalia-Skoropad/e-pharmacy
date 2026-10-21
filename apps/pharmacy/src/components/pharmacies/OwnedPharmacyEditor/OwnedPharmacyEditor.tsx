'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Building2, CheckCircle2, Save } from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';
import type { MyPharmacyProfile } from '@e-pharmacy/types/pharmacies';
import { useToast } from '@e-pharmacy/ui/feedback';
import { NameInput, PhoneInput, EmailInput } from '@e-pharmacy/ui/forms';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { readFileAsDataUrl } from '@e-pharmacy/ui/media';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { Button, TextActionButton } from '@e-pharmacy/ui/primitives';

import {
  PHARMACY_DOCUMENT_ACCEPT,
  normalizePharmacyDocument,
  validatePharmacyDocuments,
  PICTURE_ACCEPT,
  buildPictureFileError,
} from '@e-pharmacy/validation/files';

import {
  getMyPharmacyOwnerDocuments,
  getOwnedPharmacyMemberships,
} from '@/lib/api/browser';

import {
  createOwnedPharmacyDraft,
  getOwnedPharmacyProfile,
  sendOwnedPharmacyForVerification,
  updateOwnedPharmacyDraft,
  uploadOwnedPharmacyDocument,
} from '@/lib/api/browser/owned-pharmacy-editor.api';

import { PHARMACY_ROUTES, getOwnedPharmacyPath } from '@/lib/routes';
import { getProfileErrorMessage } from '@/lib/errors/get-profile-error-message';

import { WorkingHoursInput } from '@/components/profile/WorkingHoursInput';

import {
  EMPTY_FIELDS,
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

  // A route change would unmount all four tabs. Internal tab switches only
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
      'draft'
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

  async function upload(files: FileList | null) {
    if (!files?.length || !pharmacyId || mutationLock.current) return;

    const incoming = Array.from(files).map(normalizePharmacyDocument);
    const validation = validatePharmacyDocuments([...documents, ...incoming]);

    if (validation) {
      setErrors((old) => ({ ...old, documents: validation }));
      return;
    }

    mutationLock.current = true;
    setBusy('upload');

    try {
      const uploaded: Document[] = [];

      for (const file of Array.from(files)) {
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
      toast.success('Documents uploaded. Save the draft to attach them.');
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

      required:
        REQUIRED_FIELDS.data.includes(name) ||
        REQUIRED_FIELDS.about.includes(name) ||
        REQUIRED_FIELDS.payment.includes(name),

      isTouched: Boolean(errors[name]),
      error: errors[name],
      disabled: busy !== null,
      maxLength: extra?.maxLength,

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

  return (
    <main className={css.page} aria-labelledby="create-pharmacy-title">
      <section className={css.surface}>
        <TextActionButton href={PHARMACY_ROUTES.PHARMACIES}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to pharmacies
        </TextActionButton>

        <PageHeader
          title={pharmacyId ? 'Edit pharmacy draft' : 'Create pharmacy'}
          titleId="create-pharmacy-title"
          icon={<Building2 size={23} aria-hidden="true" />}
        />

        <p className={css.hint}>
          Fill in each section at your own pace. Save draft to continue later;
          sending for verification is a separate action.
        </p>

        <nav className={css.tabs} aria-label="Create pharmacy sections">
          {EDITOR_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${css.tab} ${tab === item.id ? css.active : ''}`}
              aria-current={tab === item.id ? 'step' : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {tabHasErrors(item.id, errors) ? (
                <span className={css.missing} aria-label="Incomplete section">
                  !
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div
          className={css.panel}
          role="region"
          aria-label={EDITOR_TABS.find((item) => item.id === tab)?.label}
        >
          {tab === 'data' ? (
            <>
              <h2>Pharmacy data</h2>
              <p className={css.hint}>
                Name, location, contact details, image and working hours.
              </p>

              <div className={css.grid}>
                {input('name', { maxLength: 120 })}
                {input('address')}
                {input('settlement')}
                {input('region')}
                {input('phone')}
                {input('email')}
                {input('imageUrl')}
                <div className={css.field}>
                  <label htmlFor="pharmacy-image-file">
                    Or upload a pharmacy image
                  </label>

                  <input
                    id="pharmacy-image-file"
                    type="file"
                    accept={PICTURE_ACCEPT}
                    disabled={busy !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (!file) return;

                      const error = buildPictureFileError(file);

                      if (error) {
                        setErrors((current) => ({
                          ...current,
                          imageUrl: error,
                        }));

                        return;
                      }

                      void readFileAsDataUrl(file)
                        .then((dataUrl) => change('imageUrl', dataUrl))

                        .catch(() =>
                          setErrors((current) => ({
                            ...current,
                            imageUrl: 'Could not read pharmacy image.',
                          }))
                        );

                      event.target.value = '';
                    }}
                  />
                </div>
              </div>
              {values.imageUrl ? (
                <div className={css.imagePreview}>
                  <Image
                    src={values.imageUrl}
                    alt="Pharmacy preview"
                    width={140}
                    height={110}
                    unoptimized
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ) : null}
              <WorkingHoursInput
                id="new-pharmacy-working-hours"
                value={values.workingHours}
                onValueChange={(value) => change('workingHours', value)}
                error={errors.workingHours}
                isTouched={Boolean(errors.workingHours)}
                disabled={busy !== null}
                required
              />
            </>
          ) : null}
          {tab === 'about' ? (
            <>
              <h2>About pharmacy</h2>
              <div className={css.grid}>
                <div className={css.field}>
                  <label htmlFor="pharmacy-short-description">
                    Short description *
                  </label>

                  <textarea
                    id="pharmacy-short-description"
                    value={values.shortDescription}
                    maxLength={200}
                    disabled={busy !== null}
                    onChange={(event) =>
                      change('shortDescription', event.target.value)
                    }
                  />
                  {errors.shortDescription ? (
                    <p role="alert" className={css.error}>
                      {errors.shortDescription}
                    </p>
                  ) : null}
                </div>

                <div className={css.field}>
                  <label htmlFor="pharmacy-description">Description *</label>

                  <textarea
                    id="pharmacy-description"
                    value={values.description}
                    rows={6}
                    disabled={busy !== null}
                    onChange={(event) =>
                      change('description', event.target.value)
                    }
                  />
                  {errors.description ? (
                    <p role="alert" className={css.error}>
                      {errors.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
          {tab === 'payment' ? (
            <>
              <h2>Payment details</h2>
              <div className={css.grid}>
                {input('recipientName')}
                {input('taxId')}
                {input('iban')}
                {input('bankName')}
                {input('receiptEmail')}
                {input('paymentPurpose')}
              </div>
            </>
          ) : null}
          {tab === 'documents' ? (
            <>
              <h2>Pharmacy documents</h2>
              <p className={css.hint}>
                Pharmacy verification files are separate from the Owner
                documents in your personal profile.
              </p>

              {pharmacyId ? (
                <>
                  <label
                    className={css.uploadLabel}
                    htmlFor="pharmacy-verification-files"
                  >
                    Upload pharmacy documents (PDF, Office or images)
                  </label>

                  <input
                    id="pharmacy-verification-files"
                    type="file"
                    multiple
                    accept={PHARMACY_DOCUMENT_ACCEPT}
                    disabled={busy !== null}
                    onChange={(event) => {
                      void upload(event.target.files);
                      event.target.value = '';
                    }}
                  />

                  <ul className={css.documents}>
                    {documents.map((doc) => (
                      <li key={doc.id}>
                        {doc.name}
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() =>
                            setDocuments((list) =>
                              list.filter((item) => item.id !== doc.id)
                            )
                          }
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className={css.hint}>
                  Save your draft first to get a pharmacy ID before uploading
                  documents.
                </p>
              )}
              {errors.documents ? (
                <p role="alert" className={css.error}>
                  {errors.documents}
                </p>
              ) : null}
              <p className={css.hint}>
                Owner documents:{' '}
                <a href={`${PHARMACY_ROUTES.PROFILE}/documents`}>
                  Manage in Owner profile
                </a>
                .
              </p>
              {errors.ownerDocuments ? (
                <p role="alert" className={css.error}>
                  {errors.ownerDocuments}
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <div className={css.footer}>
          {isDirty ? (
            <p className={css.unsaved} role="status">
              Unsaved changes
            </p>
          ) : (
            <p className={css.hint} role="status">
              All changes saved
            </p>
          )}

          <div className={css.actions}>
            <Button
              variant="secondary"
              iconLeft={<Save size={17} />}
              disabled={busy !== null || (Boolean(pharmacyId) && !isDirty)}
              isLoading={busy === 'save'}
              onClick={() => {
                void saveDraft();
              }}
            >
              Save draft
            </Button>

            <Button
              iconLeft={<CheckCircle2 size={17} />}
              disabled={busy !== null}
              isLoading={busy === 'verify'}
              onClick={() => {
                void verify();
              }}
            >
              Send for verification
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
