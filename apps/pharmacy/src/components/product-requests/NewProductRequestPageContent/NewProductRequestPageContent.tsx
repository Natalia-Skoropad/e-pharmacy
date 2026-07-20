'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, FilePlus2, ImagePlus, Save, Send } from 'lucide-react';

import {
  Button,
  ButtonLink,
  DocumentUpload,
  SelectField,
  type DocumentUploadFile,
} from '@e-pharmacy/ui/common';

import { CommentInput, NameInput } from '@e-pharmacy/ui/form-fields';
import { useToast } from '@e-pharmacy/ui/feedback';
import { ConfirmationModal } from '@e-pharmacy/ui/modals';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatusBanner } from '@e-pharmacy/ui/statistics';

import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
  type ProductCategory,
} from '@e-pharmacy/types/products';

import type {
  CreatePharmacyProductRequestPayload,
  ProductRequestFile,
} from '@e-pharmacy/types/product-requests';

import { createPharmacyProductRequest } from '@/lib/api/browser';

import {
  getPharmacyAllProductsPath,
  getPharmacyProductRequestsPath,
} from '@/lib/layout/routes';

import {
  getLockedFeatureBannerLabel,
  getLockedFeatureBannerStatus,
  useCurrentPharmacyStatus,
} from '@/lib/pharmacies/current-pharmacy-status';

import css from './NewProductRequestPageContent.module.css';

//===================================================================

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_ADDITIONAL_FILE_SIZE = 10 * 1024 * 1024;

//===================================================================

const CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((category) => ({
  value: category,
  label: PRODUCT_CATEGORY_LABELS[category],
}));

//===================================================================

const PRESCRIPTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Not specified' },
  { value: 'prescription', label: 'Prescription only' },
  { value: 'non_prescription', label: 'Without prescription' },
  { value: 'not_applicable', label: 'Not applicable' },
];

//===================================================================

type RequestFormState = {
  name: string;
  article: string;
  category: ProductCategory;
  manufacturer: string;
  countryOfOrigin: string;
  dosage: string;
  packageSize: string;
  form: string;
  activeSubstance: string;
  prescriptionType: string;
  storageConditions: string;
  shortDescription: string;
  fullDescription: string;
  characteristics: string;
  pharmacyComment: string;
};

type RequestFormErrors = Partial<Record<keyof RequestFormState, string>>;
type ValidationMode = 'draft' | 'moderation' | null;

//===================================================================

const INITIAL_FORM_STATE: RequestFormState = {
  name: '',
  article: '',
  category: 'medicine',
  manufacturer: '',
  countryOfOrigin: '',
  dosage: '',
  packageSize: '',
  form: '',
  activeSubstance: '',
  prescriptionType: '',
  storageConditions: '',
  shortDescription: '',
  fullDescription: '',
  characteristics: '',
  pharmacyComment: '',
};

//===================================================================

function getRequestFormErrors(
  values: RequestFormState,
  mode: Exclude<ValidationMode, null>
): RequestFormErrors {
  const errors: RequestFormErrors = {};

  if (!values.name.trim()) errors.name = 'Product name is required.';
  if (!values.article.trim()) errors.article = 'Product article is required.';

  if (mode === 'moderation') {
    if (!values.manufacturer.trim()) {
      errors.manufacturer = 'Manufacturer is required for moderation.';
    }

    if (!values.shortDescription.trim()) {
      errors.shortDescription = 'Short description is required for moderation.';
    }

    if (!values.pharmacyComment.trim()) {
      errors.pharmacyComment = 'Pharmacy comment is required for moderation.';
    }
  }

  return errors;
}

//===================================================================

function toFileMetadata(file: DocumentUploadFile): ProductRequestFile {
  return {
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
  };
}

//===================================================================

function NewProductRequestPageContent() {
  const router = useRouter();
  const toast = useToast();
  const currentPharmacyStatus = useCurrentPharmacyStatus();
  const bannerStatus = getLockedFeatureBannerStatus(currentPharmacyStatus);
  const isBlocked = currentPharmacyStatus === 'blocked';
  const isCreationLocked = Boolean(bannerStatus || isBlocked);

  const [values, setValues] = useState<RequestFormState>(INITIAL_FORM_STATE);
  const [productImage, setProductImage] = useState<DocumentUploadFile[]>([]);
  const [additionalFiles, setAdditionalFiles] = useState<DocumentUploadFile[]>(
    []
  );
  const [productImagePreview, setProductImagePreview] = useState<string | null>(
    null
  );
  const productImagePreviewUrlRef = useRef<string | null>(null);
  const [productImageError, setProductImageError] = useState('');
  const [additionalFilesError, setAdditionalFilesError] = useState('');
  const [validationMode, setValidationMode] = useState<ValidationMode>(null);
  const [savingStatus, setSavingStatus] = useState<
    CreatePharmacyProductRequestPayload['status'] | null
  >(null);
  const isSaving = savingStatus !== null;
  const [isModerationConfirmOpen, setIsModerationConfirmOpen] = useState(false);

  const errors = validationMode
    ? getRequestFormErrors(values, validationMode)
    : {};

  useEffect(() => {
    return () => {
      if (productImagePreviewUrlRef.current) {
        URL.revokeObjectURL(productImagePreviewUrlRef.current);
      }
    };
  }, []);

  const updateProductImagePreview = (file?: File) => {
    if (productImagePreviewUrlRef.current) {
      URL.revokeObjectURL(productImagePreviewUrlRef.current);
    }

    const previewUrl = file ? URL.createObjectURL(file) : null;

    productImagePreviewUrlRef.current = previewUrl;
    setProductImagePreview(previewUrl);
  };

  const updateValue = <TField extends keyof RequestFormState>(
    field: TField,
    value: RequestFormState[TField]
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleProductImageChange = (files: DocumentUploadFile[]) => {
    const image = files[0];

    if (!image) {
      updateProductImagePreview();
      setProductImage([]);
      setProductImageError('');
      return;
    }

    if (!image.type.startsWith('image/')) {
      setProductImageError('Choose a JPG, PNG, or WEBP image.');
      return;
    }

    if (image.size > MAX_IMAGE_SIZE) {
      setProductImageError('The product image must be no larger than 2 MB.');
      return;
    }

    updateProductImagePreview(image.file);
    setProductImage([image]);
    setProductImageError('');
  };

  const handleAdditionalFilesChange = (files: DocumentUploadFile[]) => {
    const oversizedFile = files.find(
      (file) => file.size > MAX_ADDITIONAL_FILE_SIZE
    );

    if (oversizedFile) {
      setAdditionalFilesError(
        `The file “${oversizedFile.name}” must be no larger than 10 MB.`
      );
      return;
    }

    setAdditionalFiles(files);
    setAdditionalFilesError('');
  };

  const buildPayload = (
    status: CreatePharmacyProductRequestPayload['status']
  ): CreatePharmacyProductRequestPayload => ({
    status,
    name: values.name.trim(),
    article: values.article.trim(),
    category: values.category,
    productImage: productImage[0] ? toFileMetadata(productImage[0]) : undefined,
    manufacturer: values.manufacturer.trim() || undefined,
    countryOfOrigin: values.countryOfOrigin.trim() || undefined,
    dosage: values.dosage.trim() || undefined,
    packageSize: values.packageSize.trim() || undefined,
    form: values.form.trim() || undefined,
    activeSubstance: values.activeSubstance.trim() || undefined,
    prescriptionType: values.prescriptionType || undefined,
    storageConditions: values.storageConditions.trim() || undefined,
    shortDescription: values.shortDescription.trim() || undefined,
    fullDescription: values.fullDescription.trim() || undefined,
    characteristics: values.characteristics.trim() || undefined,
    pharmacyComment: values.pharmacyComment.trim() || undefined,
    additionalFiles: additionalFiles.length
      ? additionalFiles.map(toFileMetadata)
      : undefined,
  });

  const createRequest = async (
    status: CreatePharmacyProductRequestPayload['status']
  ) => {
    setSavingStatus(status);

    try {
      await createPharmacyProductRequest(buildPayload(status));

      toast.success(
        status === 'draft'
          ? 'Request draft saved.'
          : 'Request sent for Admin moderation.'
      );

      router.push(getPharmacyProductRequestsPath());
      router.refresh();
    } catch {
      toast.error(
        status === 'draft'
          ? 'Could not save draft. Please try again.'
          : 'Could not send request. Please try again.'
      );
    } finally {
      setSavingStatus(null);
    }
  };

  const handleSaveDraft = () => {
    setValidationMode('draft');
    const draftErrors = getRequestFormErrors(values, 'draft');

    if (Object.keys(draftErrors).length > 0) {
      toast.error('Fill in the product name, article, and category.');
      return;
    }

    void createRequest('draft');
  };

  const handleSendForModeration = () => {
    setValidationMode('moderation');
    const moderationErrors = getRequestFormErrors(values, 'moderation');

    if (Object.keys(moderationErrors).length > 0) {
      toast.error('Fill in all fields required for moderation.');
      return;
    }

    setIsModerationConfirmOpen(true);
  };

  const handleConfirmModeration = async () => {
    setIsModerationConfirmOpen(false);
    await createRequest('new');
  };

  return (
    <main className={css.page} aria-labelledby="new-request-page-title">
      <section className={css.contentCard}>
        <PageHeader
          title="New product request"
          titleId="new-request-page-title"
          icon={<FilePlus2 size={23} aria-hidden="true" />}
          actions={
            <ButtonLink
              href={getPharmacyProductRequestsPath()}
              variant="secondary"
              size="sm"
            >
              Back to requests
            </ButtonLink>
          }
        />

        {bannerStatus ? (
          <StatusBanner
            status={bannerStatus}
            label={getLockedFeatureBannerLabel(bannerStatus)}
            title="Product request creation is locked for now"
            message={
              bannerStatus === 'on_verification'
                ? 'Creating product requests is paused while Admin reviews the submitted pharmacy profile.'
                : 'Creating product requests opens after Admin verifies and activates the pharmacy profile.'
            }
          />
        ) : null}

        {isBlocked ? (
          <StatusBanner
            status="blocked"
            label="Blocked"
            title="Product request creation is unavailable"
            message="Your account is temporarily blocked. Contact Admin to restore access."
          />
        ) : null}
      </section>

      {!isCreationLocked ? (
        <>
          <section
            className={css.noticeCard}
            aria-labelledby="before-create-title"
          >
            <div>
              <h2 className={css.noticeTitle} id="before-create-title">
                Check the global catalog first
              </h2>
              <p className={css.noticeText}>
                Create a request only when the product is not available in All
                products. Search by name and article to avoid duplicates.
              </p>
            </div>

            <ButtonLink
              href={getPharmacyAllProductsPath()}
              variant="secondary"
              size="sm"
              iconRight={<ExternalLink size={16} aria-hidden="true" />}
            >
              Open All products
            </ButtonLink>
          </section>

          <form
            className={css.form}
            onSubmit={(event) => event.preventDefault()}
          >
            <section
              className={css.formCard}
              aria-labelledby="basic-info-title"
            >
              <div className={css.sectionHeader}>
                <div>
                  <h2 className={css.sectionTitle} id="basic-info-title">
                    Basic information
                  </h2>
                  <p className={css.sectionText}>
                    Name, article, and category are enough to save a draft.
                  </p>
                </div>
              </div>

              <div className={css.imageGrid}>
                <div className={css.imagePreview}>
                  {productImagePreview ? (
                    // The preview uses a temporary browser URL for the selected local file.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={productImagePreview}
                      alt="Selected product preview"
                    />
                  ) : (
                    <div className={css.imagePlaceholder}>
                      <ImagePlus size={34} aria-hidden="true" />
                      <span>Product image</span>
                    </div>
                  )}
                </div>

                <DocumentUpload
                  id="product-request-image"
                  name="productImage"
                  label="Product image"
                  value={productImage}
                  error={productImageError}
                  isTouched={Boolean(productImageError)}
                  multiple={false}
                  maxFiles={1}
                  accept="image/jpeg,image/png,image/webp"
                  hint="JPG, PNG, or WEBP up to 2 MB. The file metadata is attached to the request."
                  labels={{
                    dropzoneTitle: 'Choose product image',
                    dropzoneText: 'Upload one clear product photo.',
                    removeAriaLabel: (fileName) => `Remove image ${fileName}`,
                  }}
                  onChange={handleProductImageChange}
                />
              </div>

              <div className={css.formGrid}>
                <NameInput
                  id="product-request-name"
                  name="name"
                  label="Product name"
                  placeholder="Enter product name"
                  value={values.name}
                  error={errors.name}
                  isTouched={Boolean(validationMode)}
                  maxLength={160}
                  autoComplete="off"
                  onChange={(event) => updateValue('name', event.target.value)}
                />

                <NameInput
                  id="product-request-article"
                  name="article"
                  label="Product article"
                  placeholder="Enter product article"
                  value={values.article}
                  error={errors.article}
                  isTouched={Boolean(validationMode)}
                  maxLength={40}
                  autoComplete="off"
                  onChange={(event) =>
                    updateValue('article', event.target.value.toUpperCase())
                  }
                />

                <SelectField
                  id="product-request-category"
                  label="Category"
                  value={values.category}
                  options={CATEGORY_OPTIONS}
                  isActive
                  onChange={(category) => updateValue('category', category)}
                />

                <NameInput
                  id="product-request-manufacturer"
                  name="manufacturer"
                  label="Manufacturer"
                  placeholder="Enter manufacturer"
                  value={values.manufacturer}
                  error={errors.manufacturer}
                  isTouched={validationMode === 'moderation'}
                  required={false}
                  hint="Required when sending the request for moderation."
                  maxLength={160}
                  autoComplete="off"
                  onChange={(event) =>
                    updateValue('manufacturer', event.target.value)
                  }
                />

                <NameInput
                  id="product-request-country"
                  name="countryOfOrigin"
                  label="Country of origin"
                  placeholder="Enter country"
                  value={values.countryOfOrigin}
                  required={false}
                  maxLength={100}
                  autoComplete="off"
                  onChange={(event) =>
                    updateValue('countryOfOrigin', event.target.value)
                  }
                />
              </div>
            </section>

            <section
              className={css.formCard}
              aria-labelledby="product-data-title"
            >
              <div className={css.sectionHeader}>
                <div>
                  <h2 className={css.sectionTitle} id="product-data-title">
                    Product data
                  </h2>
                  <p className={css.sectionText}>
                    Add the details Admin will need to create the catalog
                    product.
                  </p>
                </div>
              </div>

              <div className={css.formGrid}>
                <NameInput
                  id="product-request-dosage"
                  name="dosage"
                  label="Dosage"
                  placeholder="Example: 500 mg"
                  value={values.dosage}
                  required={false}
                  maxLength={100}
                  autoComplete="off"
                  onChange={(event) =>
                    updateValue('dosage', event.target.value)
                  }
                />

                <NameInput
                  id="product-request-package-size"
                  name="packageSize"
                  label="Package size"
                  placeholder="Example: №20 (10x2)"
                  value={values.packageSize}
                  required={false}
                  maxLength={100}
                  autoComplete="off"
                  onChange={(event) =>
                    updateValue('packageSize', event.target.value)
                  }
                />

                <NameInput
                  id="product-request-form"
                  name="form"
                  label="Form"
                  placeholder="Example: tablets"
                  value={values.form}
                  required={false}
                  maxLength={100}
                  autoComplete="off"
                  onChange={(event) => updateValue('form', event.target.value)}
                />

                <NameInput
                  id="product-request-active-substance"
                  name="activeSubstance"
                  label="Active substance"
                  placeholder="Enter active substance"
                  value={values.activeSubstance}
                  required={false}
                  maxLength={180}
                  autoComplete="off"
                  onChange={(event) =>
                    updateValue('activeSubstance', event.target.value)
                  }
                />

                <SelectField
                  id="product-request-prescription-type"
                  label="Prescription type"
                  value={values.prescriptionType}
                  options={[...PRESCRIPTION_OPTIONS]}
                  onChange={(prescriptionType) =>
                    updateValue('prescriptionType', prescriptionType)
                  }
                />

                <NameInput
                  id="product-request-storage"
                  name="storageConditions"
                  className={css.fieldWide}
                  label="Storage conditions"
                  placeholder="Describe temperature and storage requirements"
                  value={values.storageConditions}
                  required={false}
                  maxLength={500}
                  autoComplete="off"
                  onChange={(event) =>
                    updateValue('storageConditions', event.target.value)
                  }
                />
              </div>
            </section>

            <section
              className={css.formCard}
              aria-labelledby="descriptions-title"
            >
              <div className={css.sectionHeader}>
                <div>
                  <h2 className={css.sectionTitle} id="descriptions-title">
                    Descriptions and comment
                  </h2>
                  <p className={css.sectionText}>
                    Give Admin enough context to verify and create the product.
                  </p>
                </div>
              </div>

              <div className={css.textareaGrid}>
                <CommentInput
                  id="product-request-short-description"
                  name="shortDescription"
                  label="Short description"
                  placeholder="Add a concise product description"
                  value={values.shortDescription}
                  error={errors.shortDescription}
                  isTouched={validationMode === 'moderation'}
                  required={false}
                  hint="Required when sending the request for moderation."
                  maxLength={1000}
                  onChange={(event) =>
                    updateValue('shortDescription', event.target.value)
                  }
                />

                <CommentInput
                  id="product-request-full-description"
                  name="fullDescription"
                  label="Full description"
                  placeholder="Add detailed product information"
                  value={values.fullDescription}
                  required={false}
                  maxLength={5000}
                  onChange={(event) =>
                    updateValue('fullDescription', event.target.value)
                  }
                />

                <CommentInput
                  id="product-request-characteristics"
                  name="characteristics"
                  label="Characteristics"
                  placeholder="List important characteristics, composition, or package details"
                  value={values.characteristics}
                  required={false}
                  maxLength={3000}
                  onChange={(event) =>
                    updateValue('characteristics', event.target.value)
                  }
                />

                <CommentInput
                  id="product-request-pharmacy-comment"
                  name="pharmacyComment"
                  label="Pharmacy comment"
                  placeholder="Explain why this product should be added to the catalog"
                  value={values.pharmacyComment}
                  error={errors.pharmacyComment}
                  isTouched={validationMode === 'moderation'}
                  required={false}
                  hint="Required when sending the request for moderation."
                  maxLength={1500}
                  onChange={(event) =>
                    updateValue('pharmacyComment', event.target.value)
                  }
                />
              </div>
            </section>

            <section className={css.formCard} aria-labelledby="documents-title">
              <div className={css.sectionHeader}>
                <div>
                  <h2 className={css.sectionTitle} id="documents-title">
                    Additional files
                  </h2>
                  <p className={css.sectionText}>
                    Attach instructions, package photos, certificates, or other
                    supporting documents if needed.
                  </p>
                </div>
              </div>

              <DocumentUpload
                id="product-request-documents"
                name="additionalFiles"
                label="Files and documents"
                value={additionalFiles}
                error={additionalFilesError}
                isTouched={Boolean(additionalFilesError)}
                maxFiles={5}
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                hint="Up to 5 files, no larger than 10 MB each."
                labels={{
                  dropzoneTitle: 'Upload supporting files',
                  dropzoneText:
                    'PDF, DOC, JPG, PNG, or WEBP files are supported.',
                }}
                onChange={handleAdditionalFilesChange}
              />
            </section>

            <section className={css.actionsCard} aria-label="Request actions">
              <div className={css.actionsText}>
                <h2>Save or send the request</h2>
                <p>
                  A draft remains editable. After sending, Admin starts
                  reviewing the request and the pharmacy can no longer edit it.
                </p>
              </div>

              <div className={css.actions}>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  isLoading={savingStatus === 'draft'}
                  disabled={isSaving}
                  iconLeft={<Save size={18} aria-hidden="true" />}
                  onClick={handleSaveDraft}
                >
                  Save draft
                </Button>

                <Button
                  type="button"
                  size="md"
                  isLoading={savingStatus === 'new'}
                  disabled={isSaving}
                  iconLeft={<Send size={18} aria-hidden="true" />}
                  onClick={handleSendForModeration}
                >
                  Send for moderation
                </Button>
              </div>
            </section>
          </form>
        </>
      ) : null}

      {isModerationConfirmOpen ? (
        <ConfirmationModal
          title="Send request for moderation?"
          text="After sending, you will not be able to edit this request until Admin reviews it."
          confirmLabel="Send for moderation"
          cancelLabel="Keep editing"
          isLoading={savingStatus === 'new'}
          onConfirm={() => void handleConfirmModeration()}
          onCancel={() => setIsModerationConfirmOpen(false)}
        />
      ) : null}
    </main>
  );
}

export default NewProductRequestPageContent;
export { NewProductRequestPageContent };
