'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';

import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, Files, LogOut, X, Save } from 'lucide-react';

import type { MyPharmacyProfile } from '@e-pharmacy/types/pharmacies';

import { useToast } from '@e-pharmacy/ui/feedback';
import { NameInput, PhoneInput, EmailInput } from '@e-pharmacy/ui/forms';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { Tabs } from '@e-pharmacy/ui/navigation';
import { readFileAsDataUrl } from '@e-pharmacy/ui/media';
import { Button, LoadingSpinner } from '@e-pharmacy/ui/primitives';
import { InfoTooltip, ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';

import {
  normalizePharmacyDocument,
  validatePharmacyDocuments,
} from '@e-pharmacy/validation/files';

import { getOwnedPharmacyMemberships } from '@/lib/api/browser';

import {
  createOwnedPharmacyDraft,
  getOwnedPharmacyProfile,
  updateOwnedPharmacyDraft,
  uploadOwnedPharmacyDocument,
} from '@/lib/api/browser/owned-pharmacy-editor.api';

import { getOwnedPharmacyPath } from '@/lib/routes';
import { getProfileErrorMessage } from '@/lib/errors/get-profile-error-message';
import { dispatchPharmacyCounterRefresh } from '@/lib/pharmacies/pharmacy-counter-refresh';

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

import {
  FIELD_LABELS,
  FIELD_HINTS,
  TAB_ITEMS,
} from './pharmacy-editor-presentation';

import type { EditorErrors, PharmacyDocument } from './pharmacy-editor-types';

import { OwnedPharmacyEditorTabContent } from './OwnedPharmacyEditorTabContent';
import { useUnsavedPharmacyNavigation } from './useUnsavedPharmacyNavigation';
import { usePaymentAvailability } from './usePaymentAvailability';

import {
  DuplicateIdentifierSaveModal,
  getReusedIdentifierFields,
} from './DuplicateIdentifierSaveModal';

import css from './OwnedPharmacyEditor.module.css';

//===================================================================

function documentIds(documents: readonly PharmacyDocument[]) {
  return documents.map((document) => document.id).join(',');
}

//===================================================================

export function OwnedPharmacyEditor({
  pharmacyId,
  onSaved,
}: Readonly<{ pharmacyId?: string; onSaved?: () => void }>) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<PharmacyEditorTab>('data');

  const [values, setValues] = useState<PharmacyEditorValues>({
    ...EMPTY_FIELDS,
  });

  const [savedValues, setSavedValues] = useState<PharmacyEditorValues>({
    ...EMPTY_FIELDS,
  });

  const [documents, setDocuments] = useState<PharmacyDocument[]>([]);
  const [savedDocuments, setSavedDocuments] = useState<PharmacyDocument[]>([]);
  const [revision, setRevision] = useState('');
  const [errors, setErrors] = useState<EditorErrors>({});
  const [confirmSharedOpen, setConfirmSharedOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<'save' | 'upload' | null>(null);
  const mutationLock = useRef(false);
  const requestId = useRef<string | null>(null);

  const isDirty =
    JSON.stringify(values) !== JSON.stringify(savedValues) ||
    documentIds(documents) !== documentIds(savedDocuments);

  const {
    allowNavigateRef,
    pendingNavigationRef,
    leaveDialogOpen,
    setLeaveDialogOpen,
  } = useUnsavedPharmacyNavigation(isDirty);

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

  const change = (name: PharmacyEditorField, value: string) => {
    setConfirmSharedOpen(false);
    setValues((old) => ({ ...old, [name]: value }));
    setErrors((old) => ({ ...old, [name]: undefined }));
  };

  async function saveDraft(confirmedShared = false): Promise<string | null> {
    if (mutationLock.current || paymentAvailability.blocked) return null;
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

    const sharedFields = getReusedIdentifierFields(
      paymentAvailability.matches,
      values,
      savedValues
    );

    if (sharedFields.length && !confirmedShared) {
      setConfirmSharedOpen(true);
      return null;
    }

    setConfirmSharedOpen(false);
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
      dispatchPharmacyCounterRefresh();

      if (pharmacyId) onSaved?.();

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

  async function upload(files: readonly File[]) {
    if (!files.length || !pharmacyId || mutationLock.current) return;

    const incoming = files.map(normalizePharmacyDocument);
    const validation = validatePharmacyDocuments([...documents, ...incoming]);

    if (validation) {
      setErrors((old) => ({ ...old, documents: validation }));
      return;
    }

    mutationLock.current = true;
    setErrors((old) => ({ ...old, documents: undefined }));
    setBusy('upload');

    try {
      const uploaded: PharmacyDocument[] = [];

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
      try {
        const latest = await getOwnedPharmacyProfile(pharmacyId);
        const latestDocuments = [...latest.pharmacy.documents];

        if (latestDocuments.length > documents.length) {
          hydrate(latest.pharmacy);
          setErrors((old) => ({ ...old, documents: undefined }));

          toast.success(
            'Documents uploaded. Use Save draft at the top to attach them.'
          );

          return;
        }
      } catch {
        // Fall through to the canonical error message below.
      }

      const message = getProfileErrorMessage(
        cause,
        'Could not upload document.'
      );

      setErrors((old) => ({ ...old, documents: message }));
      toast.error(message);
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
      warning: fieldWarning(name),
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

  const paymentAvailability = usePaymentAvailability(
    pharmacyId,
    values,

    Boolean(
      values.taxId ||
      values.iban ||
      values.receiptEmail ||
      values.phone ||
      values.email
    )
  );

  if (loading)
    return (
      <main className={css.page} aria-label="Loading pharmacy draft">
        <section className={css.loadingCard}>
          <div className={css.loaderBox}>
            <LoadingSpinner label="Preparing pharmacy..." />
          </div>
        </section>
      </main>
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
    errors[name] ??
    (values[name].trim() || name === 'name'
      ? draftFieldErrors[name]
      : undefined) ??
    paymentAvailability.errors[
      name as 'taxId' | 'iban' | 'receiptEmail' | 'phone' | 'email'
    ];

  const fieldWarning = (name: PharmacyEditorField) =>
    !fieldError(name)
      ? paymentAvailability.warnings[
          name as 'taxId' | 'iban' | 'receiptEmail' | 'phone' | 'email'
        ]
      : undefined;

  const canSaveDraft =
    Object.keys(draftFieldErrors).length === 0 &&
    !paymentAvailability.blocked &&
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
                icon={<Building2 size={20} aria-hidden="true" />}
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
                iconLeft={<Save size={17} />}
                disabled={
                  busy !== null || !canSaveDraft || (hasSavedDraft && !isDirty)
                }
                isLoading={busy === 'save'}
                onClick={() => void saveDraft()}
              >
                Save draft
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
            <OwnedPharmacyEditorTabContent
              tab={tab}
              values={values}
              busy={busy}
              errors={errors}
              fieldError={fieldError}
              fieldWarning={fieldWarning}
              input={input}
              change={change}
              toast={toast}
              setErrors={setErrors}
              documents={documents}
              setDocuments={setDocuments}
              pharmacyId={pharmacyId}
              upload={upload}
            />
          </section>
        </div>
      </section>

      <DuplicateIdentifierSaveModal
        open={confirmSharedOpen}
        fields={getReusedIdentifierFields(
          paymentAvailability.matches,
          values,
          savedValues
        )}
        matches={paymentAvailability.matches}
        values={values}
        busy={busy === 'save'}
        onConfirm={() => void saveDraft(true)}
        onCancel={() => setConfirmSharedOpen(false)}
      />

      <ConfirmationModal
        isOpen={leaveDialogOpen}
        eyebrow="UNSAVED CHANGES"
        title="Leave pharmacy editor?"
        description="Your unsaved pharmacy changes will be lost."
        confirmLabel="Leave page"
        cancelLabel="Keep editing"
        confirmIconLeft={<LogOut size={17} aria-hidden="true" />}
        cancelIconLeft={<X size={17} aria-hidden="true" />}
        destructive
        onCancel={() => {
          pendingNavigationRef.current = null;
          setLeaveDialogOpen(false);
        }}
        onConfirm={() => {
          setLeaveDialogOpen(false);

          const navigate = pendingNavigationRef.current;

          pendingNavigationRef.current = null;
          navigate?.();
        }}
      />
    </main>
  );
}
