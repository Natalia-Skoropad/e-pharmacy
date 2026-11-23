'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  ClipboardList,
  Clock3,
  FileText,
  CheckCircle2,
  FilePlus2,
  History,
  PackageSearch,
  Save,
  Send,
  Settings,
  Trash2,
  X,
} from 'lucide-react';

import { Button, LoadingSpinner } from '@e-pharmacy/ui/primitives';
import { LinkButton } from '@e-pharmacy/ui/navigation';
import { CountLabel } from '@e-pharmacy/ui/data-display';

import {
  CategoryIcon,
  DocumentUpload,
  MarkdownTextarea,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';

import {
  readFileAsDataUrl,
  uploadManagedPhotoDetails,
  PharmacyPhotoPlaceholder,
} from '@e-pharmacy/ui/media';

import { useToast } from '@e-pharmacy/ui/feedback';
import { CommentInput, NameInput } from '@e-pharmacy/ui/forms';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { ProfileSectionHeader } from '@e-pharmacy/ui/profile';
import { StatusBadge, StatusBanner } from '@e-pharmacy/ui/statistics';

import { PRODUCT_REQUEST_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { PRODUCT_REQUEST_ERROR_CODES } from '@e-pharmacy/config/product-requests';

import { isApiError } from '@e-pharmacy/api-client/transport';

import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';

import type {
  ProductRequestFormPayload,
  ProductRequestFile,
  ProductRequestStatus,
} from '@e-pharmacy/types/product-requests';

import { formatDateTime } from '@e-pharmacy/utils/date';

import {
  PRODUCT_REQUEST_ATTACHMENT_MAX_SIZE_MB,
  PRODUCT_REQUEST_ATTACHMENTS_ACCEPT,
  PRODUCT_REQUEST_ATTACHMENT_RULES,
  PRODUCT_REQUEST_IMAGE_ACCEPT,
  PRODUCT_REQUEST_IMAGE_RULES,
  PRODUCT_REQUEST_INITIAL_VALUES,
  PRODUCT_REQUEST_LIMITS,
  PRODUCT_REQUEST_ARTICLE_PATTERN,
  PRODUCT_REQUEST_VALIDATION_MESSAGES,
  normalizeProductRequestLatinInput,
  normalizeProductRequestArticleInput,
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

import { PHARMACY_ROUTES, getPharmacyRequestPath } from '@/lib/routes';
import { storePharmacyPhoto } from '@/lib/api/browser/media-upload.api';

import {
  checkPharmacyProductRequestArticle,
  createPharmacyNote,
  createPharmacyProductRequest,
  deletePharmacyNote,
  deletePharmacyProductRequest,
  getPharmacyNotes,
  getPharmacyProductRequest,
  getProductCategories,
  updatePharmacyProductRequest,
} from '@/lib/api/browser';

import type { ProductRequestDetailsViewModel } from '@/lib/product-requests/product-requests';
import { dispatchPharmacyBreadcrumbLabel } from '@/lib/layout/breadcrumbs';
import { getProductImageSrc } from '@/lib/products/product-images';
import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';

import { EntityComments } from '@/components/comments/EntityComments';

import { resolveProductRequestPageMode } from './product-request-page-mode';

import css from './NewProductRequestPageContent.module.css';

//===================================================================

const CUSTOM_CATEGORY_OPTION_VALUE = '__custom__';

//===================================================================

type ValidationMode = ProductRequestValidationMode | null;
type RequestTab = 'editor' | 'comments' | 'history';

type EditorTab =
  | 'details'
  | 'characteristics'
  | 'full-description'
  | 'note-for-admin'
  | 'documents';

//===================================================================

export type NewProductRequestPageContentProps = Readonly<{
  requestId?: string;
  sourceRequestId?: string;
}>;

type ProductRequestLoadError = Readonly<{
  title: string;
  message: string;
}>;

//===================================================================

function getProductRequestLoadError(error: unknown): ProductRequestLoadError {
  if (isApiError(error) && [400, 404, 422].includes(error.httpStatus ?? 0)) {
    return {
      title: 'Product request not found',
      message: 'This product request does not exist or the link is invalid.',
    };
  }

  if (isApiError(error) && error.httpStatus === 403) {
    return {
      title: 'Product request is unavailable',
      message: 'You do not have access to this product request.',
    };
  }

  return {
    title: 'Product request could not be loaded',

    message: getSafeApiErrorMessage(
      error,
      'Could not load the product request. Please try again.'
    ),
  };
}

//===================================================================

function toUploadFile(
  file: ProductRequestFile,
  prefix: string
): BrowserUploadFile {
  return {
    id: `${prefix}-${file.name}-${file.size}`,
    name: file.name,
    type: file.type,
    size: file.size,
    dataUrl: file.dataUrl,
  };
}

//===================================================================

function toFormState(
  request: ProductRequestDetailsViewModel
): ProductRequestFormValues {
  return {
    name: request.name,
    article: request.article,
    categoryMode: request.categoryMode,
    categoryId: request.category?.id ?? '',
    customCategory: request.customCategory ?? '',
    brand: request.brand ?? '',
    series: request.series ?? '',
    manufacturer: request.manufacturer ?? '',
    releaseForm: request.releaseForm ?? '',
    activeIngredients: request.activeIngredients ?? '',
    activeIngredientCount: request.activeIngredientCount ?? '',
    fullDescription: request.fullDescription ?? '',
    pharmacyComment: request.pharmacyComment ?? '',
  };
}

//===================================================================

function renderSelectOption(label: string, icon: ReactNode) {
  return (
    <span className={css.optionWithIcon}>
      <span className={css.optionIcon}>{icon}</span>
      <span>{label}</span>
    </span>
  );
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

const PRODUCT_REQUEST_ACTION_ERROR_MESSAGES: Readonly<Record<string, string>> =
  {
    [PRODUCT_REQUEST_ERROR_CODES.ARTICLE_CONFLICT]:
      'This article is already used by a catalog product or another active request.',

    [PRODUCT_REQUEST_ERROR_CODES.NOT_FOUND]:
      'This product request is no longer available.',

    [PRODUCT_REQUEST_ERROR_CODES.NOT_EDITABLE]:
      'Only draft product requests can be edited.',

    [PRODUCT_REQUEST_ERROR_CODES.NOT_DELETABLE]:
      'Only draft product requests can be deleted.',

    [PRODUCT_REQUEST_ERROR_CODES.INVALID_TRANSITION]:
      'This product request status has already changed. Reload the latest data and try again.',
  };

//===================================================================

function getProductRequestActionErrorMessage(
  error: unknown,
  fallback: string
): string {
  return getSafeApiErrorMessage(error, fallback, {
    backendMessages: PRODUCT_REQUEST_ACTION_ERROR_MESSAGES,
  });
}

//===================================================================

function NewProductRequestPageContent({
  requestId,
  sourceRequestId,
}: NewProductRequestPageContentProps) {
  const router = useRouter();
  const toast = useToast();

  // Product requests are owner resources, independent of pharmacy selection.
  const cloneSourceRequestId = requestId ? undefined : sourceRequestId;

  const [request, setRequest] = useState<ProductRequestDetailsViewModel | null>(
    null
  );

  const [values, setValues] = useState<ProductRequestFormValues>(
    PRODUCT_REQUEST_INITIAL_VALUES
  );

  const [productCategories, setProductCategories] = useState<
    readonly ProductCategoryReference[]
  >([]);

  const [loadedCategory, setLoadedCategory] =
    useState<ProductCategoryReference | null>(null);

  const [productImage, setProductImage] = useState<BrowserUploadFile[]>([]);

  const [additionalFiles, setAdditionalFiles] = useState<BrowserUploadFile[]>(
    []
  );

  const [productImagePreview, setProductImagePreview] = useState<string | null>(
    null
  );

  const [isProductImageRemoved, setIsProductImageRemoved] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);

  const [isAdditionalFilesProcessing, setIsAdditionalFilesProcessing] =
    useState(false);

  const imageReadControllerRef = useRef<AbortController | null>(null);
  const additionalFilesReadControllerRef = useRef<AbortController | null>(null);
  const [productImageError, setProductImageError] = useState('');
  const [additionalFilesError, setAdditionalFilesError] = useState('');
  const [validationMode, setValidationMode] = useState<ValidationMode>(null);

  const [savingStatus, setSavingStatus] = useState<'draft' | 'new' | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(
    Boolean(requestId || cloneSourceRequestId)
  );

  const [loadError, setLoadError] = useState<ProductRequestLoadError | null>(
    null
  );

  const [activeTab, setActiveTab] = useState<RequestTab>('editor');
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTab>('details');
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [isModerationConfirmOpen, setIsModerationConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [isImageDeleteConfirmOpen, setIsImageDeleteConfirmOpen] =
    useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const mutationLockRef = useRef(false);

  const [articleCheckStatus, setArticleCheckStatus] = useState<
    'idle' | 'checking' | 'available' | 'conflict' | 'error'
  >('idle');

  const [articleCheckMessage, setArticleCheckMessage] = useState('');

  const requestMode = resolveProductRequestPageMode({
    requestId,
    sourceRequestId: cloneSourceRequestId,
    requestStatus: request?.status,
  });

  const isDraft = requestMode === 'edit';
  const canEdit = requestMode !== 'readonly';
  const isSaving = savingStatus !== null;
  const isMutating = isSaving || isDeleting;
  const isFileProcessing = isImageProcessing || isAdditionalFilesProcessing;
  const hasProductImage = productImage.length > 0 && !isProductImageRemoved;

  const articleFormatError =
    values.article &&
    !PRODUCT_REQUEST_ARTICLE_PATTERN.test(values.article.toUpperCase())
      ? PRODUCT_REQUEST_VALIDATION_MESSAGES.format.article
      : '';

  const articleError =
    articleFormatError ||
    (articleCheckStatus === 'conflict' || articleCheckStatus === 'error'
      ? articleCheckMessage
      : '');

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
    !isFileProcessing &&
    !isMutating;

  const canSaveDraft =
    isProductRequestDraftValid(values, validationContext) &&
    (!values.article.trim() || articleCheckStatus === 'available') &&
    !isFileProcessing &&
    !isMutating;

  const formErrors: ProductRequestFormErrors = validationMode
    ? validateProductRequestForm(values, validationMode, validationContext)
    : {};

  const errors: ProductRequestFormErrors = articleError
    ? { ...formErrors, article: articleError }
    : formErrors;

  const categoryOptions = useMemo(() => {
    const categories = [...productCategories];

    if (
      loadedCategory &&
      !categories.some((category) => category.id === loadedCategory.id)
    ) {
      categories.push(loadedCategory);
    }

    return [
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,

        content: renderSelectOption(
          category.name,
          <CategoryIcon name={category.icon} size={16} />
        ),
      })),
      {
        value: CUSTOM_CATEGORY_OPTION_VALUE,
        label: 'Other / custom category',

        content: renderSelectOption(
          'Other / custom category',
          <Settings size={16} aria-hidden="true" />
        ),
      },
    ] satisfies SelectOption<string>[];
  }, [loadedCategory, productCategories]);

  const selectedCategoryValue =
    values.categoryMode === 'custom'
      ? CUSTOM_CATEGORY_OPTION_VALUE
      : values.categoryId;

  const tabs = useMemo<TabItem<RequestTab>[]>(() => {
    const items: TabItem<RequestTab>[] = [
      { value: 'editor', label: 'Request details' },
    ];

    // Comments belong to an existing request, never to an unsaved draft or
    // a new request prefilled from a rejected submission.
    if (requestId) {
      items.push({ value: 'comments', label: 'Comments' });
    }

    if (requestId && request) {
      items.push({ value: 'history', label: 'Change history' });
    }

    return items;
  }, [requestId, request]);

  const editorTabs = useMemo<TabItem<EditorTab>[]>(
    () => [
      {
        value: 'details',
        label: 'Details',
        icon: <PackageSearch size={17} aria-hidden="true" />,
      },
      {
        value: 'characteristics',
        label: 'Characteristics',
        icon: <ClipboardList size={17} aria-hidden="true" />,
      },
      {
        value: 'full-description',
        label: 'Full description',
        icon: <FileText size={17} aria-hidden="true" />,
      },
      {
        value: 'note-for-admin',
        label: 'Note for Admin',
        icon: <FileText size={17} aria-hidden="true" />,
      },
      {
        value: 'documents',
        label: 'Documents',
        icon: <FilePlus2 size={17} aria-hidden="true" />,
      },
    ],
    []
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const categories = await getProductCategories({
          signal: controller.signal,
        });

        if (!controller.signal.aborted) setProductCategories(categories);
      } catch {
        if (!controller.signal.aborted) setProductCategories([]);
      }
    }

    void loadCategories();

    return () => controller.abort();
  }, []);

  useEffect(
    () => () => {
      imageReadControllerRef.current?.abort();
      additionalFilesReadControllerRef.current?.abort();
    },
    []
  );

  useEffect(() => {
    const idToLoad = requestId ?? cloneSourceRequestId;

    if (!idToLoad) return;

    const controller = new AbortController();
    const requestIdToLoad = idToLoad;

    async function loadRequest() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const loadedRequest = await getPharmacyProductRequest(requestIdToLoad, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (cloneSourceRequestId && loadedRequest.status !== 'rejected') {
          setLoadError({
            title: 'Product request cannot be copied',

            message:
              'Only rejected product requests can be used as a source for a new request.',
          });

          return;
        }

        setLoadedCategory(loadedRequest.category ?? null);
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
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setLoadError(getProductRequestLoadError(loadError));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadRequest();

    return () => {
      controller.abort();
    };
  }, [cloneSourceRequestId, requestId]);

  useEffect(() => {
    const article = values.article.trim().toUpperCase();

    if (
      !canEdit ||
      !article ||
      !PRODUCT_REQUEST_ARTICLE_PATTERN.test(values.article)
    )
      return;

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setArticleCheckStatus('checking');

      try {
        const result = await checkPharmacyProductRequestArticle(
          article,
          requestId,
          { signal: controller.signal }
        );

        if (controller.signal.aborted) return;

        setArticleCheckStatus(result.available ? 'available' : 'conflict');

        setArticleCheckMessage(
          result.available
            ? ''
            : 'This article is already used by a catalog product or another active request.'
        );
      } catch (checkError) {
        if (controller.signal.aborted) return;

        setArticleCheckStatus('error');

        setArticleCheckMessage(
          getSafeApiErrorMessage(
            checkError,
            'Article availability could not be verified. Please try again.'
          )
        );
      }
    }, 350);

    return () => {
      controller.abort();
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

  const handleProductImageChange = async (files: BrowserUploadFile[]) => {
    const image = files[0];

    if (!image) {
      if (hasProductImage) setIsImageDeleteConfirmOpen(true);

      return;
    }

    const imageError = image.file
      ? image.size > 10 * 1024 * 1024
        ? 'Photo must be no larger than 10 MB.'
        : !PRODUCT_REQUEST_IMAGE_RULES.mimeTypes.some(
              (mimeType) => mimeType === image.type
            )
          ? 'Upload JPG, PNG or WebP.'
          : ''
      : validateProductRequestImageFile(image);
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

    imageReadControllerRef.current?.abort();

    const controller = new AbortController();

    imageReadControllerRef.current = controller;
    setIsImageProcessing(true);

    try {
      const saved = await uploadManagedPhotoDetails(
        image.file,
        controller.signal,
        storePharmacyPhoto
      );

      const storedImage: BrowserUploadFile = {
        ...image,
        file: undefined,
        name: image.name.replace(/\.[^.]+$/, '') + '.webp',
        size: saved.size,
        type: saved.type,
        dataUrl: saved.url,
      };

      const optimizedError = validateProductRequestImageFile(storedImage);

      if (optimizedError) {
        setProductImageError(optimizedError);
        return;
      }

      setProductImage([storedImage]);
      setProductImagePreview(saved.url);
      setProductImageError('');
      setIsProductImageRemoved(false);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setProductImageError('The selected image could not be read.');
      }
    } finally {
      if (imageReadControllerRef.current === controller) {
        imageReadControllerRef.current = null;
        setIsImageProcessing(false);
      }
    }
  };

  const handleAdditionalFilesChange = async (files: BrowserUploadFile[]) => {
    const metadataError = validateProductRequestAdditionalFiles(files);

    if (metadataError) {
      setAdditionalFilesError(metadataError);
      return;
    }

    additionalFilesReadControllerRef.current?.abort();

    const controller = new AbortController();

    additionalFilesReadControllerRef.current = controller;
    setIsAdditionalFilesProcessing(true);

    try {
      const filesWithData: BrowserUploadFile[] = [];

      for (const file of files) {
        if (controller.signal.aborted) return;

        if (file.dataUrl || !file.file) {
          filesWithData.push(file);
          continue;
        }

        const dataUrl = await readFileAsDataUrl(file.file, controller.signal);

        filesWithData.push({ ...file, dataUrl });
      }

      if (controller.signal.aborted) return;

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
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setAdditionalFilesError('The selected files could not be read.');
      }
    } finally {
      if (additionalFilesReadControllerRef.current === controller) {
        additionalFilesReadControllerRef.current = null;
        setIsAdditionalFilesProcessing(false);
      }
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
    if (
      mutationLockRef.current ||
      imageReadControllerRef.current ||
      additionalFilesReadControllerRef.current
    ) {
      toast.error('Wait until the current file or request operation finishes.');
      return;
    }

    mutationLockRef.current = true;
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
      const message = getProductRequestActionErrorMessage(
        error,
        status === 'draft'
          ? 'Could not save draft. Please try again.'
          : 'Could not send request. Please try again.'
      );

      if (message) toast.error(message);
    } finally {
      mutationLockRef.current = false;
      setSavingStatus(null);
    }
  };

  const handleSaveDraft = () => {
    setValidationMode('draft');

    if (
      !isProductRequestDraftValid(values, validationContext) ||
      Boolean(articleError)
    ) {
      toast.error('Enter a valid product name and use a unique article.');
      return;
    }

    if (
      (values.article.trim() && articleCheckStatus !== 'available') ||
      isFileProcessing ||
      isMutating ||
      mutationLockRef.current
    ) {
      toast.error('Wait until the file, article, and request checks finish.');

      return;
    }

    void saveRequest('draft');
  };

  const handleSendForModeration = () => {
    if (isMutating || isFileProcessing || mutationLockRef.current) return;
    if (!isModerationReady) return;

    setValidationMode('moderation');
    setIsModerationConfirmOpen(true);
  };

  const handleConfirmModeration = async () => {
    if (isMutating || isFileProcessing || mutationLockRef.current) return;

    setIsModerationConfirmOpen(false);

    await saveRequest('new');
  };

  const handleDeleteDraft = async () => {
    if (!requestId || mutationLockRef.current || isFileProcessing) return;

    mutationLockRef.current = true;
    setIsDeleteConfirmOpen(false);
    setIsDeleting(true);

    try {
      await deletePharmacyProductRequest(requestId);

      toast.success('Product request draft deleted.');
      router.push(PHARMACY_ROUTES.PRODUCT_REQUESTS);
      router.refresh();
    } catch (error) {
      const message = getProductRequestActionErrorMessage(
        error,
        'Could not delete the draft.'
      );

      if (message) toast.error(message);
    } finally {
      mutationLockRef.current = false;
      setIsDeleting(false);
    }
  };

  const pageTitle =
    request?.name ??
    (requestMode === 'clone'
      ? 'New product request from rejected request'
      : 'New product request');

  const statusMessage = request ? getStatusMessage(request.status) : null;

  const savedImageSrc = request?.productImageUrl
    ? getProductImageSrc(request.productImageUrl)
    : null;

  const displayedImageSrc = isProductImageRemoved
    ? null
    : (productImagePreview ?? savedImageSrc);

  const hasHeaderActions =
    requestMode !== 'readonly' || request?.status === 'rejected';

  const showDeleteDraftAction = Boolean(isDraft);
  const showSendForModerationAction = Boolean(requestId && canEdit);

  const headerActions = (
    <div className={css.headerActions}>
      {requestMode !== 'readonly' ? (
        <>
          {showDeleteDraftAction ? (
            <Button
              type="button"
              variant="ghost"
              className={css.dangerButton}
              disabled={isMutating || isFileProcessing || !canEdit}
              isLoading={isDeleting}
              iconLeft={<Trash2 size={17} aria-hidden="true" />}
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              Delete draft
            </Button>
          ) : null}

          <Button
            type="button"
            isLoading={savingStatus === 'draft'}
            disabled={!canEdit || !canSaveDraft}
            iconLeft={<Save size={17} aria-hidden="true" />}
            onClick={handleSaveDraft}
          >
            Save draft
          </Button>

          {showSendForModerationAction ? (
            <Button
              type="button"
              isLoading={savingStatus === 'new'}
              disabled={
                isMutating || !canEdit || !isModerationReady || isFileProcessing
              }
              iconLeft={<Send size={17} aria-hidden="true" />}
              onClick={handleSendForModeration}
            >
              Send for moderation
            </Button>
          ) : null}
        </>
      ) : null}

      {request?.status === 'rejected' ? (
        <LinkButton
          href={`${PHARMACY_ROUTES.PRODUCT_REQUEST_NEW}?source=${request.id}`}
          iconRight={<FilePlus2 size={17} aria-hidden="true" />}
        >
          Create new based on rejected
        </LinkButton>
      ) : null}
    </div>
  );

  if (isLoading) {
    return (
      <main className={css.page} aria-label="Loading product request">
        <section className={css.contentCard}>
          <div className={css.loaderBox}>
            <LoadingSpinner label="Loading product request..." />
          </div>
        </section>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className={css.page} aria-labelledby="product-request-error-title">
        <section className={css.contentCard}>
          <PageHeader
            title={loadError.title}
            titleId="product-request-error-title"
            icon={<FilePlus2 size={23} aria-hidden="true" />}
          />
          <StatusBanner
            tone="danger"
            label="Error"
            title={loadError.title}
            message={loadError.message}
          />
        </section>
      </main>
    );
  }

  return (
    <main className={css.page} aria-labelledby="product-request-page-title">
      <section className={css.contentCard}>
        <PageHeader
          className={css.requestPageHeader}
          title={
            <span className={css.titleWithTooltip}>
              <span>{pageTitle}</span>
              {requestMode !== 'readonly' ? (
                <InfoTooltip
                  className={css.titleTooltip}
                  label="How product requests are created and reviewed"
                  title={
                    requestId
                      ? 'Editing your product request'
                      : 'Creating your product request'
                  }
                  icon={<FilePlus2 size={20} aria-hidden="true" />}
                  escapeOverflow
                  preferTopLayer
                  items={[
                    {
                      title: 'Save draft',
                      description:
                        'Enter a valid product name to save a draft. You can complete the other fields later; any information you enter must be valid.',
                      icon: <Save size={17} aria-hidden="true" />,
                    },
                    {
                      title: 'Complete product details',
                      description:
                        'Before moderation, add a product photo, unique article, category, brand, series, manufacturer, and a full description. Add other characteristics when relevant.',
                      icon: <CheckCircle2 size={17} aria-hidden="true" />,
                    },
                    {
                      title: 'Send for moderation',
                      description:
                        'Save the draft first, then send the completed request from its details page. The information becomes read-only during Admin review.',
                      icon: <Send size={17} aria-hidden="true" />,
                    },
                  ]}
                />
              ) : null}
            </span>
          }
          titleId="product-request-page-title"
          icon={<FilePlus2 size={23} aria-hidden="true" />}
          actions={hasHeaderActions ? headerActions : undefined}
        />

        {request && statusMessage ? (
          <StatusBanner
            {...PRODUCT_REQUEST_STATUS_PRESENTATION[request.status]}
            title={statusMessage.title}
            message={statusMessage.message}
            inlineMeta
            meta={
              <span className={css.statusUpdatedAt}>
                <Clock3 size={16} aria-hidden="true" />
                Last updated {formatDateTime(request.updatedAt) ?? '—'}
              </span>
            }
          />
        ) : null}
      </section>

      {requestId ? (
        <Tabs
          items={tabs}
          activeValue={activeTab}
          ariaLabel="Product request sections"
          mobileVisibleCount={1}
          tabletVisibleCount={3}
          onChange={setActiveTab}
        />
      ) : null}

      {activeTab === 'editor' ? (
        <form
          className={css.form}
          noValidate
          onSubmit={(event) => event.preventDefault()}
        >
          <section
            className={css.editorCard}
            aria-label="Product request editor"
          >
            <Tabs
              idBase="product-request-editor"
              items={editorTabs}
              activeValue={activeEditorTab}
              ariaLabel="Product request editor sections"
              mobileVisibleCount={1}
              tabletVisibleCount={4}
              onChange={setActiveEditorTab}
            />

            {activeEditorTab === 'details' ? (
              <section
                className={css.editorPanel}
                aria-labelledby="details-title"
              >
                <ProfileSectionHeader
                  title="Product details"
                  titleId="details-title"
                  description="Add the product name and details for Admin review. Only a valid name is required for saving a draft."
                  icon={<PackageSearch size={21} aria-hidden="true" />}
                />

                <div className={css.imageGrid}>
                  <div className={css.imagePreview}>
                    {displayedImageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={displayedImageSrc}
                        alt="Selected product preview"
                      />
                    ) : (
                      <PharmacyPhotoPlaceholder
                        icon={PackageSearch}
                        title="No product photo yet"
                        description="No photo has been added to this product request."
                      />
                    )}
                  </div>

                  <div className={css.imageUploadSlot}>
                    <DocumentUpload
                      className={css.productImageUpload}
                      id="product-request-image"
                      name="productImage"
                      label="Product image"
                      value={productImage}
                      error={productImageError || errors.productImage}
                      isTouched={Boolean(
                        productImageError || validationMode === 'moderation'
                      )}
                      required
                      disabled={!canEdit || isMutating || isFileProcessing}
                      multiple={false}
                      maxFiles={PRODUCT_REQUEST_IMAGE_RULES.maxFiles}
                      accept={PRODUCT_REQUEST_IMAGE_ACCEPT}
                      hint="JPG, PNG or WebP up to 10 MB. Optimized versions are generated automatically."
                      validateSelection={(files) => {
                        const file = files[0];

                        if (!file) return '';

                        if (!file.file)
                          return validateProductRequestImageFile(file);

                        if (file.size > 10 * 1024 * 1024)
                          return 'Photo must be no larger than 10 MB.';

                        return PRODUCT_REQUEST_IMAGE_RULES.mimeTypes.some(
                          (mimeType) => mimeType === file.type
                        )
                          ? ''
                          : 'Upload JPG, PNG or WebP.';
                      }}
                      labels={{
                        dropzoneTitle: isFileProcessing
                          ? 'Preparing image preview...'
                          : 'Choose product image',

                        dropzoneText: 'Upload one clear product photo.',
                        removeAriaLabel: (fileName) =>
                          `Remove image ${fileName}`,
                      }}
                      onChange={(files) => void handleProductImageChange(files)}
                    />
                  </div>
                </div>

                <div className={css.fieldGroups}>
                  <div className={css.fieldGroup}>
                    <div className={css.fieldsGrid}>
                      <NameInput
                        id="product-request-name"
                        name="name"
                        label="Product name"
                        hint="Use the official name shown on the package"
                        placeholder="Enter product name"
                        value={values.name}
                        error={errors.name}
                        isTouched={Boolean(validationMode)}
                        maxLength={PRODUCT_REQUEST_LIMITS.nameMax}
                        disabled={!canEdit}
                        autoComplete="off"
                        onChange={(event) =>
                          updateValue(
                            'name',
                            normalizeProductRequestLatinInput(
                              event.target.value
                            )
                          )
                        }
                      />

                      <NameInput
                        id="product-request-article"
                        name="article"
                        label="Product article"
                        required
                        hint={
                          articleCheckStatus === 'checking'
                            ? 'Checking article availability…'
                            : 'Uppercase English letters, numbers, . / _ -; no spaces'
                        }
                        placeholder="Enter product article"
                        value={values.article}
                        error={errors.article}
                        isTouched={
                          Boolean(validationMode) ||
                          Boolean(articleFormatError) ||
                          articleCheckStatus === 'conflict' ||
                          articleCheckStatus === 'error'
                        }
                        maxLength={PRODUCT_REQUEST_LIMITS.articleMax}
                        disabled={!canEdit}
                        autoComplete="off"
                        onChange={(event) =>
                          updateValue(
                            'article',
                            normalizeProductRequestArticleInput(
                              event.target.value
                            )
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className={css.fieldGroup}>
                    <div
                      className={`${css.fieldsGrid} ${css.categoryFieldsGrid}`}
                    >
                      <SelectField
                        className={css.categoryField}
                        id="product-request-category"
                        label="Category"
                        hint="Select a catalog category for this product or device"
                        required
                        reserveMessageSpace
                        value={selectedCategoryValue}
                        options={categoryOptions}
                        disabled={!canEdit}
                        error={errors.categoryId ?? errors.categoryMode}
                        onChange={(categoryValue) => {
                          if (categoryValue === CUSTOM_CATEGORY_OPTION_VALUE) {
                            updateValue('categoryMode', 'custom');
                            updateValue('categoryId', '');

                            return;
                          }

                          updateValue('categoryMode', 'catalog');
                          updateValue('categoryId', categoryValue);
                          updateValue('customCategory', '');
                        }}
                      />

                      <NameInput
                        className={css.categoryField}
                        id="product-request-custom-category"
                        name="customCategory"
                        label="Other category"
                        hint="Enter the name that will be used in the global catalog"
                        placeholder="Enter category name"
                        value={values.customCategory}
                        error={errors.customCategory}
                        isTouched={
                          values.categoryMode === 'custom' &&
                          Boolean(validationMode)
                        }
                        required={values.categoryMode === 'custom'}
                        maxLength={PRODUCT_REQUEST_LIMITS.customCategoryMax}
                        disabled={!canEdit || values.categoryMode !== 'custom'}
                        autoComplete="off"
                        onChange={(event) =>
                          updateValue(
                            'customCategory',
                            normalizeProductRequestLatinInput(
                              event.target.value
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeEditorTab === 'characteristics' ? (
              <section
                className={css.editorPanel}
                aria-labelledby="characteristics-title"
              >
                <ProfileSectionHeader
                  title="Characteristics"
                  titleId="characteristics-title"
                  description="Review the main product properties supplied for this request."
                  icon={<ClipboardList size={21} aria-hidden="true" />}
                />

                <div className={css.fieldGroups}>
                  <div className={css.fieldGroup}>
                    <div className={css.fieldsGrid}>
                      <NameInput
                        id="product-request-brand"
                        name="brand"
                        label="Brand"
                        required
                        placeholder="Enter brand"
                        value={values.brand}
                        error={errors.brand}
                        isTouched={validationMode === 'moderation'}
                        maxLength={PRODUCT_REQUEST_LIMITS.brandMax}
                        disabled={!canEdit}
                        autoComplete="off"
                        onChange={(event) =>
                          updateValue(
                            'brand',
                            normalizeProductRequestLatinInput(
                              event.target.value
                            )
                          )
                        }
                      />
                      <NameInput
                        id="product-request-series"
                        name="series"
                        label="Series / Line"
                        required
                        placeholder="Enter series or line"
                        value={values.series}
                        error={errors.series}
                        isTouched={validationMode === 'moderation'}
                        maxLength={PRODUCT_REQUEST_LIMITS.seriesMax}
                        disabled={!canEdit}
                        autoComplete="off"
                        onChange={(event) =>
                          updateValue(
                            'series',
                            normalizeProductRequestLatinInput(
                              event.target.value
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className={css.fieldGroup}>
                    <div className={css.fieldsGrid}>
                      <NameInput
                        id="product-request-manufacturer"
                        name="manufacturer"
                        label="Manufacturer"
                        required
                        placeholder="Enter manufacturer"
                        value={values.manufacturer}
                        error={errors.manufacturer}
                        isTouched={validationMode === 'moderation'}
                        maxLength={PRODUCT_REQUEST_LIMITS.manufacturerMax}
                        disabled={!canEdit}
                        autoComplete="off"
                        onChange={(event) =>
                          updateValue(
                            'manufacturer',
                            normalizeProductRequestLatinInput(
                              event.target.value
                            )
                          )
                        }
                      />
                      <NameInput
                        id="product-request-releaseForm"
                        name="releaseForm"
                        required={false}
                        label="Release form"
                        placeholder="Example: tablets, capsules, cream"
                        value={values.releaseForm}
                        error={errors.releaseForm}
                        isTouched={validationMode === 'moderation'}
                        maxLength={PRODUCT_REQUEST_LIMITS.releaseFormMax}
                        disabled={!canEdit}
                        autoComplete="off"
                        onChange={(event) =>
                          updateValue(
                            'releaseForm',
                            normalizeProductRequestLatinInput(
                              event.target.value
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className={css.fieldGroup}>
                    <div className={css.stackedFields}>
                      <NameInput
                        id="product-request-activeIngredients"
                        name="activeIngredients"
                        required={false}
                        label="Active ingredients"
                        placeholder="Enter active ingredients"
                        value={values.activeIngredients}
                        error={errors.activeIngredients}
                        isTouched={validationMode === 'moderation'}
                        maxLength={PRODUCT_REQUEST_LIMITS.activeIngredientsMax}
                        disabled={!canEdit}
                        autoComplete="off"
                        onChange={(event) =>
                          updateValue(
                            'activeIngredients',
                            normalizeProductRequestLatinInput(
                              event.target.value
                            )
                          )
                        }
                      />
                      <NameInput
                        id="product-request-activeIngredientCount"
                        name="activeIngredientCount"
                        required={false}
                        label="Active ingredient count"
                        placeholder="Example: Vitamin C: 500 mg, calcium: 55 mg"
                        value={values.activeIngredientCount}
                        error={errors.activeIngredientCount}
                        isTouched={validationMode === 'moderation'}
                        maxLength={
                          PRODUCT_REQUEST_LIMITS.activeIngredientCountMax
                        }
                        disabled={!canEdit}
                        autoComplete="off"
                        onChange={(event) =>
                          updateValue(
                            'activeIngredientCount',
                            normalizeProductRequestLatinInput(
                              event.target.value
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {activeEditorTab === 'full-description' ? (
              <section
                className={css.editorPanel}
                aria-labelledby="description-title"
              >
                <ProfileSectionHeader
                  title="Full description"
                  titleId="description-title"
                  description="Add complete product information using the same editor as the pharmacy public description."
                  icon={<FileText size={21} aria-hidden="true" />}
                />

                <MarkdownTextarea
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
                  onValueChange={(nextValue) =>
                    updateValue('fullDescription', nextValue)
                  }
                />
              </section>
            ) : null}

            {activeEditorTab === 'note-for-admin' ? (
              <section
                className={css.editorPanel}
                aria-labelledby="admin-comment-title"
              >
                <ProfileSectionHeader
                  title="Note for Admin"
                  titleId="admin-comment-title"
                  description="Use this optional field to explain something directly to Admin."
                  icon={<FileText size={21} aria-hidden="true" />}
                />

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
            ) : null}

            {activeEditorTab === 'documents' ? (
              <section
                className={css.editorPanel}
                aria-labelledby="documents-title"
              >
                <ProfileSectionHeader
                  title="Documents"
                  titleId="documents-title"
                  description="Attach instructions, package photos, certificates, or other supporting documents if needed."
                  icon={<FilePlus2 size={21} aria-hidden="true" />}
                />

                <DocumentUpload
                  id="product-request-documents"
                  name="additionalFiles"
                  label="Files and documents"
                  value={additionalFiles}
                  error={additionalFilesError || errors.additionalFiles}
                  isTouched={Boolean(
                    additionalFilesError || errors.additionalFiles
                  )}
                  disabled={!canEdit || isMutating || isFileProcessing}
                  maxFiles={PRODUCT_REQUEST_ATTACHMENT_RULES.maxFiles}
                  accept={PRODUCT_REQUEST_ATTACHMENTS_ACCEPT}
                  hint={`Up to ${PRODUCT_REQUEST_ATTACHMENT_RULES.maxFiles} files, no larger than ${PRODUCT_REQUEST_ATTACHMENT_MAX_SIZE_MB} MB each.`}
                  validateSelection={(files) =>
                    validateProductRequestAdditionalFiles(files)
                  }
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
            ) : null}
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
            load={(page, options) =>
              getPharmacyNotes('product_request', request.id, page, options)
            }
            create={(text, options) =>
              createPharmacyNote(
                'product_request',
                request.id,
                text,
                options.clientRequestId,
                options
              )
            }
            remove={(id, options) =>
              deletePharmacyNote('product_request', request.id, id, options)
            }
            onTotalChange={setCommentsTotal}
          />
        ) : (
          <section className={css.formCard}>
            <StatusBanner
              {...PRODUCT_REQUEST_STATUS_PRESENTATION.draft}
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

              const description =
                entry.status === 'rejected' &&
                request.rejectionReason &&
                entry.description.trim() === request.rejectionReason.trim()
                  ? 'Admin rejected the request because the submitted information needs correction.'
                  : entry.description;

              return (
                <li key={entry.id} className={toneClassName}>
                  <History size={18} aria-hidden="true" />
                  <div className={css.historyContent}>
                    <div className={css.historyTopRow}>
                      <div className={css.historyMeta}>
                        <strong>{entry.title}</strong>
                        {entry.isInferred ? (
                          <span className={css.historyInferred}>
                            Legacy history · exact event time unavailable
                          </span>
                        ) : (
                          <time dateTime={entry.createdAt}>
                            {formatDateTime(entry.createdAt) ?? '—'}
                          </time>
                        )}
                      </div>

                      <StatusBadge
                        {...PRODUCT_REQUEST_STATUS_PRESENTATION[entry.status]}
                      />
                    </div>

                    <p>{description}</p>

                    {entry.status === 'rejected' && request.rejectionReason ? (
                      <p className={css.historyRejectionReason}>
                        <b>Rejection reason:</b> {request.rejectionReason}
                      </p>
                    ) : null}
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
          eyebrow="PHOTO"
          title="Remove photo?"
          text="This photo will be removed. Are you sure?"
          confirmLabel="Remove photo"
          cancelLabel="Keep photo"
          destructive
          confirmIconLeft={<Trash2 size={17} aria-hidden="true" />}
          cancelIconLeft={<X size={17} aria-hidden="true" />}
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
