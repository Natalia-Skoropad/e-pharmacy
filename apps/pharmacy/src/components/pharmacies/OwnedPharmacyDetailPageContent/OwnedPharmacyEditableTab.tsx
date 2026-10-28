'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Save } from 'lucide-react';

import type { MyPharmacyProfile } from '@e-pharmacy/types/pharmacies';

import { readFileAsDataUrl } from '@e-pharmacy/ui/media';
import { useToast } from '@e-pharmacy/ui/feedback';
import { EmailInput, NameInput, PhoneInput } from '@e-pharmacy/ui/forms';
import { Button } from '@e-pharmacy/ui/primitives';

import {
  normalizePharmacyDocument,
  validatePharmacyDocuments,
} from '@e-pharmacy/validation/files';

import {
  updateOwnedPharmacyDraft,
  uploadOwnedPharmacyDocument,
} from '@/lib/api/browser/owned-pharmacy-editor.api';

import { getProfileErrorMessage } from '@/lib/errors/get-profile-error-message';

import {
  buildPharmacyEditorPayload,
  validatePharmacyEditor,
  effectivePharmacyEditorValues,
  type PharmacyEditorField,
  type PharmacyEditorTab,
} from '../OwnedPharmacyEditor/pharmacy-editor-fields';

import {
  FIELD_HINTS,
  FIELD_LABELS,
} from '../OwnedPharmacyEditor/pharmacy-editor-presentation';

import type {
  EditorErrors,
  PharmacyDocument,
} from '../OwnedPharmacyEditor/pharmacy-editor-types';

import { OwnedPharmacyEditorTabContent } from '../OwnedPharmacyEditor/OwnedPharmacyEditorTabContent';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

type Props = Readonly<{
  tab: PharmacyEditorTab;
  pharmacy: MyPharmacyProfile;
  onSaved: () => void;
  readOnly?: boolean;
}>;

//===================================================================

/** Reuse Create pharmacy's canonical form fields, validators and documents UI. */
export function OwnedPharmacyEditableTab({
  tab,
  pharmacy,
  onSaved,
  readOnly = false,
}: Props) {
  const toast = useToast();

  const [values, setValues] = useState(() =>
    effectivePharmacyEditorValues(pharmacy)
  );

  const [saved, setSaved] = useState(() =>
    effectivePharmacyEditorValues(pharmacy)
  );

  const [documents, setDocuments] = useState<PharmacyDocument[]>(() => [
    ...(pharmacy.pendingModeration?.documents ?? pharmacy.documents),
  ]);

  const [savedDocuments, setSavedDocuments] = useState<PharmacyDocument[]>(
    () => [...(pharmacy.pendingModeration?.documents ?? pharmacy.documents)]
  );

  const [revision, setRevision] = useState(pharmacy.updatedAt);
  const [errors, setErrors] = useState<EditorErrors>({});
  const [busy, setBusy] = useState<'save' | 'upload' | null>(null);
  const mutationLock = useRef(false);

  const dirty =
    JSON.stringify(values) !== JSON.stringify(saved) ||
    documents.map((doc) => doc.id).join(',') !==
      savedDocuments.map((doc) => doc.id).join(',');

  const validation = validatePharmacyEditor(values, documents.length, 'draft');

  const fieldError = (name: PharmacyEditorField) =>
    errors[name] ?? (values[name].trim() ? validation[name] : undefined);

  const change = (name: PharmacyEditorField, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const input = (
    name: PharmacyEditorField,
    extra?: { type?: string; maxLength?: number }
  ) => {
    const common = {
      id: `edit-pharmacy-${name}`,
      name,
      value: values[name],
      label: FIELD_LABELS[name],
      required: true,
      error: fieldError(name),
      isTouched: Boolean(fieldError(name)),
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
  };

  const upload = async (files: readonly File[]) => {
    if (readOnly || !files.length || mutationLock.current) return;

    const normalized = files.map(normalizePharmacyDocument);
    const error = validatePharmacyDocuments([...documents, ...normalized]);

    if (error) {
      setErrors((current) => ({ ...current, documents: error }));
      return;
    }

    mutationLock.current = true;
    setBusy('upload');

    try {
      const uploaded: PharmacyDocument[] = [];
      for (const file of files) {
        const document = normalizePharmacyDocument(file);
        const dataUrl = await readFileAsDataUrl(file);

        const response = await uploadOwnedPharmacyDocument(pharmacy.id, {
          ...document,
          dataUrl,
        });

        uploaded.push(response.document);
      }

      setDocuments((current) => [...current, ...uploaded]);
      toast.success('Documents uploaded. Save this section to attach them.');
    } catch (cause) {
      toast.error(getProfileErrorMessage(cause, 'Could not upload documents.'));
    } finally {
      mutationLock.current = false;
      setBusy(null);
    }
  };

  const save = async () => {
    if (readOnly || mutationLock.current || !dirty) return;

    const errorsForSection = validatePharmacyEditor(
      values,
      documents.length,
      'draft'
    );

    const keys =
      tab === 'data'
        ? [
            'name',
            'address',
            'settlement',
            'region',
            'phone',
            'email',
            'workingHours',
            'imageUrl',
            'shortDescription',
          ]
        : tab === 'about'
          ? ['description']
          : tab === 'payment'
            ? [
                'recipientName',
                'taxId',
                'iban',
                'bankName',
                'receiptEmail',
                'paymentPurpose',
              ]
            : ['documents'];

    const relevantErrors = Object.fromEntries(
      Object.entries(errorsForSection).filter(([key]) => keys.includes(key))
    ) as EditorErrors;

    if (Object.keys(relevantErrors).length) {
      setErrors(relevantErrors);
      toast.error('Correct the highlighted fields before saving.');
      return;
    }

    mutationLock.current = true;
    setBusy('save');

    try {
      const changes = buildPharmacyEditorPayload(values, saved);

      if (
        documents.map((doc) => doc.id).join(',') !==
        savedDocuments.map((doc) => doc.id).join(',')
      ) {
        changes.documents = documents.map((doc) => ({ documentId: doc.id }));
      }

      const result = await updateOwnedPharmacyDraft(pharmacy.id, {
        ...changes,
        expectedRevision: revision,
      });

      const removedDocuments = savedDocuments.some(
        (document) => !documents.some((entry) => entry.id === document.id)
      );

      setSaved(effectivePharmacyEditorValues(result.pharmacy));
      setRevision(result.pharmacy.updatedAt);
      setSavedDocuments([...documents]);
      setErrors({});

      toast.success(
        removedDocuments
          ? pharmacy.status === 'new'
            ? 'Documents removed successfully.'
            : 'Document removal saved for moderation.'
          : 'Pharmacy changes saved successfully.'
      );
      onSaved();
    } catch (cause) {
      toast.error(
        getProfileErrorMessage(
          cause,
          'Could not save pharmacy changes. Check document availability and refresh the pharmacy if it was edited elsewhere.'
        )
      );
    } finally {
      mutationLock.current = false;
      setBusy(null);
    }
  };

  return (
    <div className={css.formStack}>
      {!readOnly && (
        <div className={css.sectionActions}>
          <Button
            iconLeft={<Save size={17} />}
            disabled={!dirty || busy !== null}
            isLoading={busy === 'save'}
            onClick={() => void save()}
          >
            Save changes
          </Button>
        </div>
      )}

      <OwnedPharmacyEditorTabContent
        tab={tab}
        values={values}
        busy={readOnly ? 'save' : busy}
        errors={errors}
        fieldError={fieldError}
        input={input}
        change={change}
        toast={toast}
        setErrors={setErrors}
        documents={documents}
        setDocuments={setDocuments}
        pharmacyId={pharmacy.id}
        documentsEditable={!readOnly}
        upload={upload}
      />
    </div>
  );
}
