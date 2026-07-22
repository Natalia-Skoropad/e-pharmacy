'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Clock3,
  ExternalLink,
  FileCheck2,
  FilePlus2,
  History,
  ImagePlus,
  Save,
  Send,
  Trash2,
} from 'lucide-react';

import {
  Button,
  ButtonLink,
  CountLabel,
  DocumentUpload,
  InfoTooltip,
  LoadingSpinner,
  SelectField,
  Tabs,
  TextEditor,
  type DocumentUploadFile,
  type TabItem,
} from '@e-pharmacy/ui/common';

import { EntityComments, useToast } from '@e-pharmacy/ui/feedback';
import { CommentInput, NameInput } from '@e-pharmacy/ui/form-fields';
import { ConfirmationModal } from '@e-pharmacy/ui/modals';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatusBadge, StatusBanner } from '@e-pharmacy/ui/statistics';

import {
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_LABELS,
} from '@e-pharmacy/types/products';

import {
  PRODUCT_REQUEST_STATUS_LABELS,
  type ProductRequestFormPayload,
  type ProductRequestDetails,
  type ProductRequestFile,
  type ProductRequestStatus,
} from '@e-pharmacy/types/product-requests';

import { formatOrderDateTime } from '@e-pharmacy/utils/formatters';

import {
  PRODUCT_REQUEST_ATTACHMENT_MAX_SIZE_MB,
  PRODUCT_REQUEST_ATTACHMENTS_ACCEPT,
  PRODUCT_REQUEST_ATTACHMENT_RULES,
  PRODUCT_REQUEST_IMAGE_ACCEPT,
  PRODUCT_REQUEST_IMAGE_MAX_SIZE_MB,
  PRODUCT_REQUEST_IMAGE_RULES,
  PRODUCT_REQUEST_INITIAL_VALUES,
  PRODUCT_REQUEST_LIMITS,
  isProductRequestDraftValid,
  isProductRequestSubmissionValid,
  normalizeProductRequestForm,
  toProductRequestFileMetadata,
  validateProductRequestAdditionalFiles,
  validateProductRequestForm,
  validateProductRequestImageFile,
  type ProductRequestFormErrors,
  type ProductRequestFormValues,
  type ProductRequestValidationMode,
} from '@e-pharmacy/validation/product-requests';

import {
  checkPharmacyProductRequestArticle,
  createPharmacyNote,
  createPharmacyProductRequest,
  deletePharmacyNote,
  deletePharmacyProductRequest,
  getPharmacyNotes,
  getPharmacyProductRequest,
  updatePharmacyProductRequest,
} from '@/lib/api/browser';

import { dispatchPharmacyBreadcrumbLabel } from '@/lib/layout/breadcrumbs';

import {
  getPharmacyAllProductsPath,
  getPharmacyNewRequestPath,
  getPharmacyRequestPath,
  getPharmacyProductRequestsPath,
} from '@/lib/layout/routes';

import {
  getLockedFeatureBannerLabel,
  getLockedFeatureBannerStatus,
  useCurrentPharmacyStatus,
} from '@/lib/pharmacies/current-pharmacy-status';

import { getProductImageSrc } from '@/lib/products/product-images';

import css from './NewProductRequestPageContent.module.css';

//===================================================================

const CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((category) => ({
  value: category,
  label: PRODUCT_CATEGORY_LABELS[category],
}));

const PRESCRIPTION_OPTIONS = [
  { value: '', label: 'Select prescription type' },
  { value: 'prescription', label: 'Prescription only' },
  { value: 'non_prescription', label: 'Without prescription' },
  { value: 'not_applicable', label: 'Not applicable' },
] as const;

type ValidationMode = ProductRequestValidationMode | null;
type RequestTab = 'details' | 'comments' | 'history';

export type NewProductRequestPageContentProps = Readonly<{
  requestId?: string;
  sourceRequestId?: string;
}>;

//===================================================================

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('The selected file could not be read.'));
    reader.onerror = () =>
      reject(new Error('The selected file could not be read.'));
    reader.readAsDataURL(file);
  });
}

//===================================================================

function toUploadFile(
  file: ProductRequestFile,
  prefix: string
): DocumentUploadFile {
  return {
    id: `${prefix}-${file.name}-${file.size}`,
    name: file.name,
    type: file.type,
    size: file.size,
    dataUrl: file.dataUrl,
  };
}

//===================================================================

function toFormState(request: ProductRequestDetails): ProductRequestFormValues {
  return {
    name: request.name,
    article: request.article,
    category: request.category,
    customCategory: request.customCategory ?? '',
    manufacturer: request.manufacturer ?? '',
    countryOfOrigin: request.countryOfOrigin ?? '',
    dosage: request.dosage ?? '',
    packageSize: request.packageSize ?? '',
    form: request.form ?? '',
    activeSubstance: request.activeSubstance ?? '',
    prescriptionType: request.prescriptionType ?? '',
    fullDescription: request.fullDescription ?? '',
    pharmacyComment: request.pharmacyComment ?? '',
  };
}

//===================================================================

function getStatusMessage(status: ProductRequestStatus) {
  switch (status) {
    case 'draft':
      return {
        title: 'This request is a draft',
        message:
          'You can edit the request, manage private pharmacy comments, or send it for moderation.',
      };

    case 'new':
      return {
        title: 'The request was sent for moderation',
        message:
          'The submitted information is locked while Admin reviews the request.',
      };

    case 'in_progress':
      return {
        title: 'Admin is reviewing this request',
        message:
          'The request is in work and all submitted fields are read-only.',
      };

    case 'approved':
      return {
        title: 'The product request was approved',
        message:
          'Admin approved the request and created or linked the catalog product.',
      };

    case 'rejected':
      return {
        title: 'The product request was rejected',
        message:
          'Review the reason in Change history and create a corrected request from this data.',
      };
  }
}

//===================================================================

function NewProductRequestPageContent({
  requestId,
  sourceRequestId,
}: NewProductRequestPageContentProps) {
  const router = useRouter();
  const toast = useToast();
  const currentPharmacyStatus = useCurrentPharmacyStatus();
  const bannerStatus = getLockedFeatureBannerStatus(currentPharmacyStatus);
  const isBlocked = currentPharmacyStatus === 'blocked';
  const isCreationLocked = Boolean(bannerStatus || isBlocked);
  const cloneSourceRequestId = requestId ? undefined : sourceRequestId;

  const [request, setRequest] = useState<ProductRequestDetails | null>(null);

  const [values, setValues] = useState<ProductRequestFormValues>(
    PRODUCT_REQUEST_INITIAL_VALUES
  );

  const [productImage, setProductImage] = useState<DocumentUploadFile[]>([]);

  const [additionalFiles, setAdditionalFiles] = useState<DocumentUploadFile[]>(
    []
  );

  const [productImagePreview, setProductImagePreview] = useState<string | null>(
    null
  );

  const [isProductImageRemoved, setIsProductImageRemoved] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [productImageError, setProductImageError] = useState('');
  const [additionalFilesError, setAdditionalFilesError] = useState('');
  const [validationMode, setValidationMode] = useState<ValidationMode>(null);

  const [savingStatus, setSavingStatus] = useState<'draft' | 'new' | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(
    Boolean(requestId || cloneSourceRequestId)
  );

  const [hasLoadError, setHasLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState<RequestTab>('details');
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [isModerationConfirmOpen, setIsModerationConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [isImageDeleteConfirmOpen, setIsImageDeleteConfirmOpen] =
    useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [articleCheckStatus, setArticleCheckStatus] = useState<
    'idle' | 'checking' | 'available' | 'unavailable'
  >('idle');

  const [articleCheckMessage, setArticleCheckMessage] = useState('');

  const isDraft = request?.status === 'draft';
  const isReadonly = Boolean(request && request.status !== 'draft');
  const canEdit = !isReadonly && !isCreationLocked;
  const isSaving = savingStatus !== null;
  const hasProductImage = productImage.length > 0 && !isProductImageRemoved;

  const articleError =
    articleCheckStatus === 'unavailable' ? articleCheckMessage : undefined;

  const validationContext = useMemo(
    () => ({
      hasProductImage,
      productImage: productImage[0] ?? null,
      additionalFiles,
    }),
    [additionalFiles, hasProductImage, productImage]
  );

  const isModerationReady =
    isProductRequestSubmissionValid(values, validationContext) &&
    articleCheckStatus === 'available' &&
    !isImageProcessing;

  const formErrors: ProductRequestFormErrors = validationMode
    ? validateProductRequestForm(values, validationMode, validationContext)
    : {};

  const errors: ProductRequestFormErrors = articleError
    ? { ...formErrors, article: articleError }
    : formErrors;

  const tabs = useMemo<TabItem<RequestTab>[]>(() => {
    const items: TabItem<RequestTab>[] = [
      { value: 'details', label: 'Request details' },
      { value: 'comments', label: `Comments (${commentsTotal})` },
    ];

    if (request) {
      items.push({
        value: 'history',
        label: `Change history (${request.history.length})`,
      });
    }

    return items;
  }, [commentsTotal, request]);

  useEffect(() => {
    const idToLoad = requestId ?? cloneSourceRequestId;
    if (!idToLoad) return;
    const requestIdToLoad = idToLoad;

    let isMounted = true;

    async function loadRequest() {
      setIsLoading(true);
      setHasLoadError(false);

      try {
        const loadedRequest = await getPharmacyProductRequest(requestIdToLoad);
        if (!isMounted) return;

        setValues(toFormState(loadedRequest));
        setProductImage(
          loadedRequest.productImage
            ? [toUploadFile(loadedRequest.productImage, 'product-image')]
            : []
        );
        setProductImagePreview(loadedRequest.productImage?.dataUrl ?? null);
        setIsProductImageRemoved(false);
        setAdditionalFiles(
          (loadedRequest.additionalFiles ?? []).map((file, index) =>
            toUploadFile(file, `additional-${index}`)
          )
        );

        if (requestId) {
          setRequest(loadedRequest);
          setCommentsTotal(loadedRequest.commentsTotal);
          dispatchPharmacyBreadcrumbLabel(loadedRequest.name);
        }
      } catch {
        if (isMounted) setHasLoadError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadRequest();

    return () => {
      isMounted = false;
    };
  }, [cloneSourceRequestId, requestId]);

  useEffect(() => {
    const article = values.article.trim().toUpperCase();
    if (!canEdit || !article) return;

    let isCurrent = true;
    const timeoutId = window.setTimeout(async () => {
      setArticleCheckStatus('checking');

      try {
        const result = await checkPharmacyProductRequestArticle(
          article,
          requestId
        );
        if (!isCurrent) return;

        setArticleCheckStatus(result.available ? 'available' : 'unavailable');
        setArticleCheckMessage(
          result.message ?? 'This article is already in use.'
        );
      } catch {
        if (!isCurrent) return;
        setArticleCheckStatus('unavailable');
        setArticleCheckMessage(
          'Could not verify the product article. Try again.'
        );
      }
    }, 350);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [canEdit, requestId, values.article]);

  const updateValue = <TField extends keyof ProductRequestFormValues>(
    field: TField,
    value: ProductRequestFormValues[TField]
  ) => {
    if (field === 'article') {
      setArticleCheckStatus('idle');
      setArticleCheckMessage('');
    }

    setValues((current) => ({ ...current, [field]: value }));
  };

  const clearProductImage = () => {
    setProductImage([]);
    setProductImagePreview(null);
    setProductImageError('');
    setIsProductImageRemoved(true);
  };

  const handleProductImageChange = async (files: DocumentUploadFile[]) => {
    const image = files[0];

    if (!image) {
      if (hasProductImage) setIsImageDeleteConfirmOpen(true);
      return;
    }

    const imageError = validateProductRequestImageFile(image);
    if (imageError) {
      setProductImageError(imageError);
      return;
    }

    if (!image.file) {
      setProductImage([image]);
      setProductImageError('');
      setIsProductImageRemoved(false);
      return;
    }

    setIsImageProcessing(true);

    try {
      const dataUrl = await readFileAsDataUrl(image.file);
      setProductImage([{ ...image, dataUrl }]);
      setProductImagePreview(dataUrl);
      setProductImageError('');
      setIsProductImageRemoved(false);
    } catch (error) {
      setProductImageError(
        error instanceof Error
          ? error.message
          : 'The selected file could not be read.'
      );
    } finally {
      setIsImageProcessing(false);
    }
  };

  const handleAdditionalFilesChange = async (files: DocumentUploadFile[]) => {
    const metadataError = validateProductRequestAdditionalFiles(files);
    if (metadataError) {
      setAdditionalFilesError(metadataError);
      return;
    }

    try {
      const filesWithData = await Promise.all(
        files.map(async (file) => {
          if (file.dataUrl || !file.file) return file;

          return {
            ...file,
            dataUrl: await readFileAsDataUrl(file.file),
          };
        })
      );

      const filesError = validateProductRequestAdditionalFiles(filesWithData, {
        requireDataUrl: true,
      });
      if (filesError) {
        setAdditionalFilesError(filesError);
        return;
      }

      setAdditionalFiles(filesWithData);
      setAdditionalFilesError('');
    } catch (error) {
      setAdditionalFilesError(
        error instanceof Error
          ? error.message
          : 'The selected file could not be read.'
      );
    }
  };

  const buildPayload = (
    status: ProductRequestFormPayload['status']
  ): ProductRequestFormPayload =>
    normalizeProductRequestForm(values, status, {
      productImage:
        hasProductImage && productImage[0]
          ? toProductRequestFileMetadata(productImage[0], productImagePreview)
          : undefined,
      additionalFiles: additionalFiles.length
        ? additionalFiles.map((file) => toProductRequestFileMetadata(file))
        : undefined,
    });

  const saveRequest = async (status: 'draft' | 'new') => {
    setSavingStatus(status);

    try {
      if (requestId) {
        const updatedRequest = await updatePharmacyProductRequest(
          requestId,
          buildPayload(status)
        );
        setRequest(updatedRequest);
        setCommentsTotal(updatedRequest.commentsTotal);
        toast.success(
          status === 'draft'
            ? 'Request draft saved.'
            : 'Request sent for Admin moderation.'
        );
        router.refresh();
        return;
      }

      const createdRequest = await createPharmacyProductRequest(
        buildPayload(status)
      );
      toast.success(
        status === 'draft'
          ? 'Request draft saved.'
          : 'Request sent for Admin moderation.'
      );
      router.push(getPharmacyRequestPath(createdRequest.id));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : status === 'draft'
            ? 'Could not save draft. Please try again.'
            : 'Could not send request. Please try again.'
      );
    } finally {
      setSavingStatus(null);
    }
  };

  const handleSaveDraft = () => {
    setValidationMode('draft');

    if (
      !isProductRequestDraftValid(values, validationContext) ||
      Boolean(articleError)
    ) {
      toast.error(
        'Fill in the required draft fields and use a unique article.'
      );
      return;
    }

    if (articleCheckStatus !== 'available' || isImageProcessing) {
      toast.error('Wait until the image and product article checks finish.');
      return;
    }

    void saveRequest('draft');
  };

  const handleSendForModeration = () => {
    if (!isModerationReady) return;
    setValidationMode('moderation');
    setIsModerationConfirmOpen(true);
  };

  const handleConfirmModeration = async () => {
    setIsModerationConfirmOpen(false);
    await saveRequest('new');
  };

  const handleDeleteDraft = async () => {
    if (!requestId) return;

    setIsDeleteConfirmOpen(false);
    setIsDeleting(true);

    try {
      await deletePharmacyProductRequest(requestId);
      toast.success('Product request draft deleted.');
      router.push(getPharmacyProductRequestsPath());
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : 'Could not delete the draft.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const pageTitle = request?.name ?? 'New product request';
  const statusMessage = request ? getStatusMessage(request.status) : null;
  const savedImageSrc = request?.productImageUrl
    ? getProductImageSrc(request.productImageUrl)
    : null;
  const displayedImageSrc = isProductImageRemoved
    ? null
    : (productImagePreview ?? savedImageSrc);

  const headerActions = (
    <div className={css.headerActions}>
      {!request || isDraft ? (
        <>
          {isDraft ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={css.dangerButton}
              disabled={isSaving || isDeleting || !canEdit}
              isLoading={isDeleting}
              iconLeft={<Trash2 size={17} aria-hidden="true" />}
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              Delete draft
            </Button>
          ) : null}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={savingStatus === 'draft'}
            disabled={
              isSaving ||
              !canEdit ||
              articleCheckStatus !== 'available' ||
              isImageProcessing
            }
            iconLeft={<Save size={17} aria-hidden="true" />}
            onClick={handleSaveDraft}
          >
            Save draft
          </Button>

          <Button
            type="button"
            size="sm"
            isLoading={savingStatus === 'new'}
            disabled={
              isSaving || !canEdit || !isModerationReady || isImageProcessing
            }
            iconLeft={<Send size={17} aria-hidden="true" />}
            onClick={handleSendForModeration}
          >
            Send for moderation
          </Button>
        </>
      ) : null}

      {request?.status === 'rejected' ? (
        <ButtonLink
          href={`${getPharmacyNewRequestPath()}?source=${request.id}`}
          size="sm"
          iconRight={<FilePlus2 size={17} aria-hidden="true" />}
        >
          Create new based on rejected
        </ButtonLink>
      ) : null}
    </div>
  );

  if (isLoading) {
    return (
      <main className={css.page}>
        <section className={css.contentCard}>
          <LoadingSpinner label="Loading product request..." />
        </section>
      </main>
    );
  }

  if (hasLoadError) {
    return (
      <main className={css.page}>
        <section className={css.contentCard}>
          <StatusBanner
            status="rejected"
            title="Product request was not found"
            message="The request may have been removed, or it does not belong to the current pharmacy."
          />
        </section>
      </main>
    );
  }

  return (
    <main className={css.page} aria-labelledby="product-request-page-title">
      <section className={css.contentCard}>
        <PageHeader
          className={
            isDraft
              ? `${css.requestPageHeader} ${css.draftPageHeader}`
              : css.requestPageHeader
          }
          title={
            <span className={css.titleWithTooltip}>
              <span>{pageTitle}</span>
              {!request || isDraft ? (
                <InfoTooltip
                  className={css.titleTooltip}
                  label="About saving and sending product requests"
                  title="Save or send the request"
                  icon={<FileCheck2 size={20} strokeWidth={2} />}
                >
                  A draft remains editable. After sending, Admin starts
                  reviewing the request and the pharmacy can no longer edit it.
                </InfoTooltip>
              ) : null}
            </span>
          }
          titleId="product-request-page-title"
          icon={<FilePlus2 size={23} aria-hidden="true" />}
          actions={headerActions}
        />

        {bannerStatus ? (
          <StatusBanner
            status={bannerStatus}
            label={getLockedFeatureBannerLabel(bannerStatus)}
            title="Product request management is locked for now"
            message="Creating and editing requests becomes available after Admin verifies the pharmacy profile."
          />
        ) : null}

        {isBlocked ? (
          <StatusBanner
            status="blocked"
            label="Blocked"
            title="Product request management is unavailable"
            message="Your account is temporarily blocked. Contact Admin to restore access."
          />
        ) : null}

        {request && statusMessage ? (
          <StatusBanner
            status={request.status}
            label={PRODUCT_REQUEST_STATUS_LABELS[request.status]}
            title={statusMessage.title}
            message={statusMessage.message}
            meta={
              <span className={css.statusUpdatedAt}>
                <Clock3 size={16} aria-hidden="true" />
                Last updated {formatOrderDateTime(request.updatedAt)}
              </span>
            }
          />
        ) : null}
      </section>

      {!request ? (
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
      ) : null}

      <Tabs
        items={tabs}
        activeValue={activeTab}
        ariaLabel="Product request sections"
        mobileVisibleCount={1}
        tabletVisibleCount={3}
        onChange={setActiveTab}
      />

      {activeTab === 'details' ? (
        <form className={css.form} onSubmit={(event) => event.preventDefault()}>
          <section className={css.formCard} aria-labelledby="basic-info-title">
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
                {displayedImageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayedImageSrc} alt="Selected product preview" />
                ) : (
                  <div className={css.imagePlaceholder}>
                    <ImagePlus size={34} aria-hidden="true" />
                    <span>{productImage[0]?.name ?? 'Product image'}</span>
                  </div>
                )}
              </div>

              <div className={css.imageUploadSlot}>
                <DocumentUpload
                  id="product-request-image"
                  name="productImage"
                  label="Product image"
                  value={productImage}
                  error={productImageError || errors.productImage}
                  isTouched={Boolean(
                    productImageError || validationMode === 'moderation'
                  )}
                  required
                  disabled={!canEdit || isImageProcessing}
                  multiple={false}
                  maxFiles={PRODUCT_REQUEST_IMAGE_RULES.maxFiles}
                  accept={PRODUCT_REQUEST_IMAGE_ACCEPT}
                  hint={`JPG, PNG, or WEBP up to ${PRODUCT_REQUEST_IMAGE_MAX_SIZE_MB} MB.`}
                  labels={{
                    dropzoneTitle: isImageProcessing
                      ? 'Preparing image preview...'
                      : 'Choose product image',
                    dropzoneText: 'Upload one clear product photo.',
                    removeAriaLabel: (fileName) => `Remove image ${fileName}`,
                  }}
                  onChange={(files) => void handleProductImageChange(files)}
                />
              </div>
            </div>

            <div className={css.primaryGrid}>
              <NameInput
                id="product-request-name"
                name="name"
                label="Product name"
                hint="Use the official name shown on the package."
                placeholder="Enter product name"
                value={values.name}
                error={errors.name}
                isTouched={Boolean(validationMode)}
                maxLength={PRODUCT_REQUEST_LIMITS.nameMax}
                disabled={!canEdit}
                autoComplete="off"
                onChange={(event) => updateValue('name', event.target.value)}
              />

              <NameInput
                id="product-request-article"
                name="article"
                label="Product article"
                hint="Enter the unique manufacturer or supplier article."
                placeholder="Enter product article"
                value={values.article}
                error={errors.article}
                isTouched={
                  Boolean(validationMode) ||
                  articleCheckStatus === 'unavailable'
                }
                maxLength={PRODUCT_REQUEST_LIMITS.articleMax}
                disabled={!canEdit}
                autoComplete="off"
                onChange={(event) =>
                  updateValue('article', event.target.value.toUpperCase())
                }
              />

              <NameInput
                id="product-request-manufacturer"
                name="manufacturer"
                label="Manufacturer"
                hint="Enter the full manufacturer name."
                placeholder="Enter manufacturer"
                value={values.manufacturer}
                error={errors.manufacturer}
                isTouched={validationMode === 'moderation'}
                maxLength={PRODUCT_REQUEST_LIMITS.manufacturerMax}
                disabled={!canEdit}
                autoComplete="off"
                onChange={(event) =>
                  updateValue('manufacturer', event.target.value)
                }
              />
            </div>

            <div className={css.categoryGrid}>
              <NameInput
                id="product-request-country"
                name="countryOfOrigin"
                label="Country of origin"
                hint="Use the country printed on the product package."
                placeholder="Enter country"
                value={values.countryOfOrigin}
                error={errors.countryOfOrigin}
                isTouched={validationMode === 'moderation'}
                maxLength={PRODUCT_REQUEST_LIMITS.countryOfOriginMax}
                disabled={!canEdit}
                autoComplete="off"
                onChange={(event) =>
                  updateValue('countryOfOrigin', event.target.value)
                }
              />

              <SelectField
                id="product-request-category"
                label="Category"
                hint="Select the closest catalog category."
                required
                value={values.category}
                options={CATEGORY_OPTIONS}
                disabled={!canEdit}
                onChange={(category) => {
                  updateValue('category', category);
                  if (category !== 'other') updateValue('customCategory', '');
                }}
              />

              <NameInput
                id="product-request-custom-category"
                name="customCategory"
                label="Other category"
                hint="Enter the category Admin should use."
                placeholder="Enter category name"
                value={values.customCategory}
                error={errors.customCategory}
                isTouched={
                  values.category === 'other' && Boolean(validationMode)
                }
                required={values.category === 'other'}
                maxLength={PRODUCT_REQUEST_LIMITS.customCategoryMax}
                disabled={!canEdit || values.category !== 'other'}
                autoComplete="off"
                onChange={(event) =>
                  updateValue('customCategory', event.target.value)
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
                  Add the details Admin will need to create the catalog product.
                </p>
              </div>
            </div>

            <div className={css.productGrid}>
              <NameInput
                id="product-request-dosage"
                name="dosage"
                label="Dosage"
                placeholder="Example: 500 mg"
                value={values.dosage}
                error={errors.dosage}
                isTouched={validationMode === 'moderation'}
                maxLength={PRODUCT_REQUEST_LIMITS.dosageMax}
                disabled={!canEdit}
                autoComplete="off"
                onChange={(event) => updateValue('dosage', event.target.value)}
              />

              <NameInput
                id="product-request-package-size"
                name="packageSize"
                label="Package size"
                placeholder="Example: №20 (10x2)"
                value={values.packageSize}
                error={errors.packageSize}
                isTouched={validationMode === 'moderation'}
                maxLength={PRODUCT_REQUEST_LIMITS.packageSizeMax}
                disabled={!canEdit}
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
                error={errors.form}
                isTouched={validationMode === 'moderation'}
                maxLength={PRODUCT_REQUEST_LIMITS.formMax}
                disabled={!canEdit}
                autoComplete="off"
                onChange={(event) => updateValue('form', event.target.value)}
              />
            </div>

            <div className={css.substanceGrid}>
              <NameInput
                id="product-request-active-substance"
                name="activeSubstance"
                label="Active substance"
                placeholder="Enter active substance"
                value={values.activeSubstance}
                error={errors.activeSubstance}
                isTouched={validationMode === 'moderation'}
                maxLength={PRODUCT_REQUEST_LIMITS.activeSubstanceMax}
                disabled={!canEdit}
                autoComplete="off"
                onChange={(event) =>
                  updateValue('activeSubstance', event.target.value)
                }
              />

              <SelectField
                id="product-request-prescription-type"
                label="Prescription type"
                required
                value={values.prescriptionType}
                options={[...PRESCRIPTION_OPTIONS]}
                error={
                  validationMode === 'moderation'
                    ? errors.prescriptionType
                    : undefined
                }
                disabled={!canEdit}
                onChange={(prescriptionType) =>
                  updateValue('prescriptionType', prescriptionType)
                }
              />
            </div>
          </section>

          <section className={css.formCard} aria-labelledby="description-title">
            <div className={css.sectionHeader}>
              <div>
                <h2 className={css.sectionTitle} id="description-title">
                  Full description
                </h2>
                <p className={css.sectionText}>
                  Add complete product information using the same editor as the
                  pharmacy public description.
                </p>
              </div>
            </div>

            <TextEditor
              id="product-request-full-description"
              name="fullDescription"
              label="Full description"
              placeholder="Describe the product, composition, use, package, and other important details."
              hint="You can use simple formatting buttons or type plain text."
              value={values.fullDescription}
              error={errors.fullDescription}
              isTouched={validationMode === 'moderation'}
              maxLength={PRODUCT_REQUEST_LIMITS.fullDescriptionMax}
              disabled={!canEdit}
              onChange={(event) =>
                updateValue('fullDescription', event.target.value)
              }
            />
          </section>

          <section
            className={css.formCard}
            aria-labelledby="admin-comment-title"
          >
            <div className={css.sectionHeader}>
              <div>
                <h2 className={css.sectionTitle} id="admin-comment-title">
                  Additional note for Admin
                </h2>
                <p className={css.sectionText}>
                  This field is optional. Use it only when the pharmacy wants to
                  explain something directly to Admin.
                </p>
              </div>
            </div>

            <CommentInput
              id="product-request-pharmacy-comment"
              name="pharmacyComment"
              label="Pharmacy note for Admin"
              placeholder="Add an optional note for Admin."
              value={values.pharmacyComment}
              required={false}
              maxLength={PRODUCT_REQUEST_LIMITS.pharmacyCommentMax}
              disabled={!canEdit}
              onChange={(event) =>
                updateValue('pharmacyComment', event.target.value)
              }
            />
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
              error={additionalFilesError || errors.additionalFiles}
              isTouched={Boolean(
                additionalFilesError || errors.additionalFiles
              )}
              disabled={!canEdit}
              maxFiles={PRODUCT_REQUEST_ATTACHMENT_RULES.maxFiles}
              accept={PRODUCT_REQUEST_ATTACHMENTS_ACCEPT}
              hint={`Up to ${PRODUCT_REQUEST_ATTACHMENT_RULES.maxFiles} files, no larger than ${PRODUCT_REQUEST_ATTACHMENT_MAX_SIZE_MB} MB each.`}
              confirmRemove
              labels={{
                dropzoneTitle: 'Upload supporting files',
                dropzoneText:
                  'PDF, DOC, JPG, PNG, or WEBP files are supported.',
                removeTitle: 'Remove additional file?',
                removeText: (fileName) =>
                  `The file “${fileName}” will be removed from this request after you confirm and save the draft.`,
                removeConfirm: 'Remove file',
                removeCancel: 'Keep file',
              }}
              onSelectionError={setAdditionalFilesError}
              onChange={(files) => void handleAdditionalFilesChange(files)}
            />
          </section>
        </form>
      ) : null}

      {activeTab === 'comments' ? (
        request ? (
          <EntityComments
            entityKey={`product-request:${request.id}`}
            title="Private pharmacy comments"
            commentTitle="Pharmacy comment"
            placeholder="Write a private comment about this product request..."
            emptyText="No private pharmacy comments have been added yet."
            initialTotal={commentsTotal}
            isEditable={request.status === 'draft'}
            load={(page) =>
              getPharmacyNotes('product_request', request.id, page)
            }
            create={(text) =>
              createPharmacyNote('product_request', request.id, text)
            }
            remove={(id) =>
              deletePharmacyNote('product_request', request.id, id)
            }
            onTotalChange={setCommentsTotal}
          />
        ) : (
          <section className={css.formCard}>
            <StatusBanner
              status="draft"
              title="Comments are not available yet"
              message="Save the request as a draft first. Private pharmacy comments will become available after the draft is created."
            />
          </section>
        )
      ) : null}

      {activeTab === 'history' && request ? (
        <section
          className={css.formCard}
          aria-labelledby="request-history-title"
        >
          <div className={css.historyHeader}>
            <h2 className={css.sectionTitle} id="request-history-title">
              Change history
            </h2>

            <CountLabel
              shown={request.history.length}
              total={request.history.length}
              label="history events"
            />
          </div>

          <ol className={css.historyList}>
            {[...request.history].reverse().map((entry) => {
              const toneClassName =
                entry.status === 'rejected'
                  ? css.historyDanger
                  : entry.status === 'in_progress'
                    ? css.historyWarning
                    : entry.status === 'new'
                      ? css.historyInfo
                      : undefined;

              return (
                <li key={entry.id} className={toneClassName}>
                  <History size={18} aria-hidden="true" />
                  <div className={css.historyContent}>
                    <strong>{entry.title}</strong>
                    <time dateTime={entry.createdAt}>
                      {formatOrderDateTime(entry.createdAt)}
                    </time>
                    <StatusBadge
                      status={entry.status}
                      label={PRODUCT_REQUEST_STATUS_LABELS[entry.status]}
                    />
                    <p>{entry.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {isModerationConfirmOpen ? (
        <ConfirmationModal
          title="Send request for moderation?"
          text="After sending, all fields and private comments become read-only while Admin reviews the request."
          confirmLabel="Send for moderation"
          cancelLabel="Keep editing"
          isLoading={savingStatus === 'new'}
          onConfirm={() => void handleConfirmModeration()}
          onCancel={() => setIsModerationConfirmOpen(false)}
        />
      ) : null}

      {isImageDeleteConfirmOpen ? (
        <ConfirmationModal
          title="Remove product image?"
          text="The image will be removed from this request after you confirm and save the draft."
          confirmLabel="Remove image"
          cancelLabel="Keep image"
          onConfirm={() => {
            clearProductImage();
            setIsImageDeleteConfirmOpen(false);
          }}
          onCancel={() => setIsImageDeleteConfirmOpen(false)}
        />
      ) : null}

      {isDeleteConfirmOpen ? (
        <ConfirmationModal
          title="Delete product request draft?"
          text="The draft and all its private pharmacy comments will be deleted permanently."
          confirmLabel="Delete draft"
          cancelLabel="Keep draft"
          isLoading={isDeleting}
          onConfirm={() => void handleDeleteDraft()}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
      ) : null}
    </main>
  );
}

export default NewProductRequestPageContent;
export { NewProductRequestPageContent };
