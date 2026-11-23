'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import {
  ClipboardCheck,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  FileText,
  Files,
  StickyNote,
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
  submitPharmacyProductRequest,
  cancelPharmacyProductRequest,
  getProductCategories,
  updatePharmacyProductRequest,
  uploadPharmacyProductRequestDocument,
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

type EditorTab =
  | 'details'
  | 'characteristics'
  | 'full-description'
  | 'note-for-admin'
  | 'documents'
  | 'comments'
  | 'activity';

//===================================================================

export type NewProductRequestPageContentProps = Readonly<{
  requestId?: string;
  sourceRequestId?: string;
  initialTab?: EditorTab;
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
    id: file.documentId ?? `${prefix}-${file.name}-${file.size}`,
    documentId: file.documentId,
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

const PRODUCT_REQUEST_ACTION_ERROR_MESSAGES: Readonly<Record<string, string>> =
  {
    [PRODUCT_REQUEST_ERROR_CODES.ARTICLE_CONFLICT]:
      'This article is already used by a catalog product or another active request.',

    [PRODUCT_REQUEST_ERROR_CODES.NOT_FOUND]:
      'This product request is no longer available.',

    [PRODUCT_REQUEST_ERROR_CODES.NOT_EDITABLE]:
      'Only New requests and requests needing corrections can be edited.',

    [PRODUCT_REQUEST_ERROR_CODES.NOT_DELETABLE]:
      'Only New product requests can be deleted.',

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
  initialTab = 'details',
}: NewProductRequestPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
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

  const [savingStatus, setSavingStatus] = useState<'new' | 'moderation' | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(
    Boolean(requestId || cloneSourceRequestId)
  );

  const [loadError, setLoadError] = useState<ProductRequestLoadError | null>(
    null
  );

  const [activeEditorTab, setActiveEditorTab] = useState<EditorTab>(initialTab);
  const [savedSignature, setSavedSignature] = useState('');
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
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
    reviewState: request?.reviewState,
  });

  const canEdit = requestMode !== 'readonly';
  const isSaving = savingStatus !== null;
  const isMutating = isSaving || isDeleting;
  const isFileProcessing = isImageProcessing || isAdditionalFilesProcessing;

  const currentSignature = JSON.stringify({
    values,

    image: productImage.map((file) => [
      file.documentId,
      file.dataUrl,
      file.name,
    ]),

    files: additionalFiles.map((file) => [
      file.documentId,
      file.name,
      file.size,
    ]),
  });

  const isDirty = Boolean(
    requestId && request && savedSignature !== currentSignature
  );

  const canSubmitSaved = Boolean(
    requestId && request && !isDirty && !isMutating && !isFileProcessing
  );

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
    !isMutating &&
    (!requestId || isDirty);

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
        label: 'About product',
        icon: <FileText size={17} aria-hidden="true" />,
      },
      {
        value: 'note-for-admin',
        label: 'Note for Admin',
        icon: <StickyNote size={17} aria-hidden="true" />,
      },
      {
        value: 'documents',
        label: 'Documents',
        icon: <Files size={17} aria-hidden="true" />,
      },

      ...(requestId
        ? [
            {
              value: 'comments' as const,
              label: 'Comments',
              icon: <StickyNote size={17} aria-hidden="true" />,
            },
            {
              value: 'activity' as const,
              label: 'Activity history',
              icon: <History size={17} aria-hidden="true" />,
            },
          ]
        : []),
    ],
    [requestId]
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
        setSavedSignature(
          JSON.stringify({
            values: toFormState(loadedRequest),

            image: (loadedRequest.productImage
              ? [toUploadFile(loadedRequest.productImage, 'product-image')]
              : []
            ).map((file) => [file.documentId, file.dataUrl, file.name]),

            files: (loadedRequest.additionalFiles ?? []).map((file) => [
              file.documentId,
              file.name,
              file.size,
            ]),
          })
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

        // Pre-existing attached documents are represented by a stable ID.
        // A legacy embedded document is uploaded when the selection changes.
        if (file.documentId || (!file.file && !file.dataUrl)) {
          filesWithData.push(file);
          continue;
        }

        const dataUrl =
          file.dataUrl ??
          (await readFileAsDataUrl(file.file!, controller.signal));

        if (controller.signal.aborted) return;

        const fileMetadata = toProductRequestFileMetadata(file);

        const uploaded = await uploadPharmacyProductRequestDocument({
          name: fileMetadata.name,
          type: fileMetadata.type,
          size: fileMetadata.size,
          dataUrl,
        });

        if (controller.signal.aborted) return;

        filesWithData.push({
          ...file,
          id: uploaded.document.documentId,
          name: uploaded.document.name,
          type: uploaded.document.type,
          documentId: uploaded.document.documentId,
          dataUrl: undefined,
        });
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
        setAdditionalFilesError(
          'The selected files could not be uploaded. Please try again.'
        );
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

  const saveRequest = async () => {
    if (
      mutationLockRef.current ||
      imageReadControllerRef.current ||
      additionalFilesReadControllerRef.current
    ) {
      toast.error('Wait until the current file or request operation finishes.');
      return;
    }

    mutationLockRef.current = true;
    setSavingStatus('new');

    try {
      if (requestId) {
        const updatedRequest = await updatePharmacyProductRequest(
          requestId,
          buildPayload('new')
        );

        setRequest(updatedRequest);
        setCommentsTotal(updatedRequest.commentsTotal);

        setAdditionalFiles(
          (updatedRequest.additionalFiles ?? []).map((file, index) =>
            toUploadFile(file, `additional-${index}`)
          )
        );

        setSavedSignature(currentSignature);
        toast.success('Changes saved.');
        router.refresh();

        return;
      }

      const createdRequest = await createPharmacyProductRequest(
        buildPayload('new')
      );

      toast.success('New request saved. You can continue editing it.');
      router.push(getPharmacyRequestPath(createdRequest.id));
      router.refresh();
    } catch (error) {
      const message = getProductRequestActionErrorMessage(
        error,
        'Could not save changes. Please try again.'
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

    void saveRequest();
  };

  const handleSendForModeration = () => {
    if (isMutating || isFileProcessing || mutationLockRef.current) return;
    if (!isModerationReady) return;

    setValidationMode('moderation');
    setIsModerationConfirmOpen(true);
  };

  const handleConfirmModeration = async () => {
    if (
      !requestId ||
      !canSubmitSaved ||
      !isModerationReady ||
      mutationLockRef.current
    )
      return;

    mutationLockRef.current = true;
    setSavingStatus('moderation');

    try {
      const result = await submitPharmacyProductRequest(requestId);

      setRequest(result);
      setIsModerationConfirmOpen(false);
      setStatusMenuOpen(false);
      toast.success('Request sent for moderation.');
      router.refresh();
    } catch (error) {
      toast.error(
        getProductRequestActionErrorMessage(
          error,
          'Could not submit the request.'
        )
      );
    } finally {
      mutationLockRef.current = false;
      setSavingStatus(null);
    }
  };

  const handleCancelRequest = async () => {
    if (!requestId || mutationLockRef.current) return;

    mutationLockRef.current = true;
    setIsDeleting(true);

    try {
      const result = await cancelPharmacyProductRequest(requestId);

      setRequest(result);
      setIsCancelConfirmOpen(false);
      setStatusMenuOpen(false);
      toast.success('Product request cancelled.');
      router.refresh();
    } catch (error) {
      toast.error(
        getProductRequestActionErrorMessage(
          error,
          'Could not cancel the request.'
        )
      );
    } finally {
      mutationLockRef.current = false;
      setIsDeleting(false);
    }
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

  useEffect(() => {
    if (!statusMenuOpen) return;

    const onClick = (event: MouseEvent) => {
      if (!statusMenuRef.current?.contains(event.target as Node))
        setStatusMenuOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setStatusMenuOpen(false);
    };

    document.addEventListener('pointerdown', onClick);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [statusMenuOpen]);

  useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    // Links in the sidebar and breadcrumbs should use the same confirmation modal.
    const onLinkClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');

      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank')
        return;

      if (
        anchor.origin !== window.location.origin ||
        anchor.pathname === pathname
      )
        return;

      event.preventDefault();
      event.stopImmediatePropagation();
      setPendingPath(anchor.pathname + anchor.search + anchor.hash);
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onLinkClick, true);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onLinkClick, true);
    };
  }, [isDirty, pathname]);

  const pageTitle =
    request?.name ??
    (requestMode === 'clone'
      ? 'New product request from rejected request'
      : 'New product request');

  const savedImageSrc = request?.productImageUrl
    ? getProductImageSrc(request.productImageUrl)
    : null;

  const displayedImageSrc = isProductImageRemoved
    ? null
    : (productImagePreview ?? savedImageSrc);

  const hasHeaderActions =
    canEdit ||
    request?.status === 'rejected' ||
    request?.status === 'on_moderation';

  const canModerate =
    request?.status === 'new' ||
    (request?.status === 'on_moderation' &&
      request.reviewState === 'changes_requested');

  const showStatusMenu = Boolean(
    requestId &&
    (request?.status === 'new' || request?.status === 'on_moderation')
  );

  const isSendDisabled = !canModerate || !isModerationReady || !canSubmitSaved;

  const onEditorTabChange = (tab: EditorTab) => {
    if (tab === activeEditorTab) return;

    const url = requestId
      ? `${getPharmacyRequestPath(requestId)}/${tab === 'full-description' ? 'about-product' : tab}`
      : '';

    if (isDirty) {
      setPendingPath(url || `tab:${tab}`);
      return;
    }

    setActiveEditorTab(tab);

    if (url) router.push(url);
  };

  const headerActions = (
    <div className={css.headerActions}>
      {canEdit ? (
        <Button
          type="button"
          isLoading={savingStatus === 'new'}
          disabled={!canSaveDraft}
          iconLeft={<Save size={17} aria-hidden="true" />}
          onClick={handleSaveDraft}
        >
          {requestId ? 'Save changes' : 'Save draft'}
        </Button>
      ) : null}
      {showStatusMenu ? (
        <div className={css.statusMenu} ref={statusMenuRef}>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            aria-haspopup="menu"
            aria-expanded={statusMenuOpen}
            aria-controls="request-status-actions-menu"
            iconLeft={<ClipboardCheck size={17} aria-hidden="true" />}
            onClick={() => setStatusMenuOpen((open) => !open)}
          >
            Manage request status <ChevronDown size={16} aria-hidden="true" />
          </Button>
          {statusMenuOpen ? (
            <div
              className={css.statusMenuOptions}
              id="request-status-actions-menu"
              role="menu"
              aria-label="Available request actions"
            >
              <div className={css.statusActionRow}>
                <button
                  type="button"
                  role="menuitem"
                  className={css.sendStatusAction}
                  disabled={isSendDisabled}
                  onClick={() => {
                    setStatusMenuOpen(false);
                    handleSendForModeration();
                  }}
                >
                  <Send size={17} aria-hidden="true" />{' '}
                  {request?.reviewState === 'changes_requested'
                    ? 'Resend for moderation'
                    : 'Send for moderation'}
                </button>
                <InfoTooltip
                  label="Moderation requirements"
                  title="Send for moderation"
                  items={[
                    {
                      title: 'Required details',
                      description:
                        'Save all changes, then provide a photo, unique article, category, brand, series, manufacturer, and an About product text of at least 100 characters.',
                      icon: <CircleHelp size={16} />,
                    },
                  ]}
                />
              </div>
              {request?.status === 'new' ? (
                <button
                  type="button"
                  role="menuitem"
                  className={css.dangerStatusAction}
                  disabled={isMutating}
                  onClick={() => {
                    setStatusMenuOpen(false);
                    setIsDeleteConfirmOpen(true);
                  }}
                >
                  <Trash2 size={17} aria-hidden="true" /> Delete request draft
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  className={css.dangerStatusAction}
                  disabled={!request?.reviewState || isMutating}
                  onClick={() => {
                    setStatusMenuOpen(false);
                    setIsCancelConfirmOpen(true);
                  }}
                >
                  <X size={17} aria-hidden="true" /> Cancel request
                </button>
              )}
            </div>
          ) : null}
        </div>
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
                        'Before moderation, add a product photo, unique article, category, brand, series, manufacturer, and an About product description of at least 100 characters. Add other characteristics when relevant.',
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

        {request ? (
          <div className={css.requestStatusLine}>
            <StatusBadge
              {...PRODUCT_REQUEST_STATUS_PRESENTATION[request.status]}
            />
            {request.reviewState === 'changes_requested' ? (
              <span className={css.changesRequested}>Needs changes</span>
            ) : null}

            {request.status === 'rejected' && request.cancelledBy ? (
              <span className={css.changesRequested}>
                Cancelled by{' '}
                {request.cancelledBy === 'admin' ? 'Admin' : 'owner'}
              </span>
            ) : null}

            {request.reviewState === 'changes_requested' &&
            request.rejectionReason ? (
              <span role="status">
                Admin feedback: {request.rejectionReason}
              </span>
            ) : null}

            <span className={css.statusUpdatedAt}>
              <Clock3 size={16} aria-hidden="true" /> Last updated{' '}
              {formatDateTime(request.updatedAt) ?? '—'}
            </span>
          </div>
        ) : null}
      </section>

      {activeEditorTab !== 'comments' && activeEditorTab !== 'activity' ? (
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
              onChange={onEditorTabChange}
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
                  title="About product"
                  titleId="description-title"
                  description="Describe this product in detail using the same editor as About pharmacy."
                  icon={<FileText size={21} aria-hidden="true" />}
                />

                <MarkdownTextarea
                  id="product-request-full-description"
                  name="fullDescription"
                  expanded
                  label="About product"
                  placeholder="Describe the product, composition, use, package, and other important details."
                  hint="At least 100 characters when filled. You can use simple formatting or type plain text."
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
                  icon={<StickyNote size={21} aria-hidden="true" />}
                />

                <CommentInput
                  id="product-request-pharmacy-comment"
                  name="pharmacyComment"
                  className={css.noteField}
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
                  icon={<Files size={21} aria-hidden="true" />}
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
                  hint={`PDF, DOC, DOCX, JPG, PNG or WEBP. Up to ${PRODUCT_REQUEST_ATTACHMENT_RULES.maxFiles} files, ${PRODUCT_REQUEST_ATTACHMENT_MAX_SIZE_MB} MB each.`}
                  validateSelection={(files) =>
                    validateProductRequestAdditionalFiles(files)
                  }
                  confirmRemove
                  labels={{
                    dropzoneTitle: 'Upload supporting files',

                    dropzoneText:
                      'PDF, DOC, DOCX, JPG, PNG or WEBP. Up to 6 files, 10 MB each.',

                    removeTitle: 'Remove additional file?',

                    removeText: (fileName) =>
                      `The file “${fileName}” will be removed from this request after you confirm and save the draft.`,

                    removeConfirm: 'Remove file',
                    removeCancel: 'Keep file',
                  }}
                  onSelectionError={setAdditionalFilesError}
                  onDownloadFile={async (file) => {
                    if (!file.documentId) return '';

                    const sourceId = requestId ?? cloneSourceRequestId;

                    return sourceId
                      ? `/api/product-requests/${encodeURIComponent(sourceId)}/documents/${encodeURIComponent(file.documentId)}`
                      : '';
                  }}
                  onChange={(files) => void handleAdditionalFilesChange(files)}
                />
              </section>
            ) : null}
          </section>
        </form>
      ) : null}

      {activeEditorTab === 'comments' ? (
        request ? (
          <EntityComments
            entityKey={`product-request:${request.id}`}
            title="Private pharmacy comments"
            commentTitle="Pharmacy comment"
            placeholder="Write a private comment about this product request..."
            emptyText="No private pharmacy comments have been added yet."
            initialTotal={commentsTotal}
            isEditable={
              request.status === 'new' ||
              (request.status === 'on_moderation' &&
                request.reviewState === 'changes_requested')
            }
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
              {...PRODUCT_REQUEST_STATUS_PRESENTATION.new}
              title="Comments are not available yet"
              message="Save the request as a draft first. Private pharmacy comments will become available after the draft is created."
            />
          </section>
        )
      ) : null}

      {activeEditorTab === 'activity' && request ? (
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
                  : entry.status === 'on_moderation'
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
          text="Once submitted, the request becomes read-only. Admin can approve it, ask for corrections (Needs changes), or reject/cancel it. You can edit and resubmit only after corrections are requested."
          confirmLabel="Send for moderation"
          cancelLabel="Keep editing"
          isLoading={savingStatus === 'moderation'}
          onConfirm={() => void handleConfirmModeration()}
          onCancel={() => setIsModerationConfirmOpen(false)}
        />
      ) : null}

      {isCancelConfirmOpen ? (
        <ConfirmationModal
          title="Cancel product request?"
          eyebrow="CANCEL REQUEST"
          text="The request will become Rejected / Cancelled by owner. This cannot be undone."
          destructive
          confirmLabel="Cancel request"
          cancelLabel="Keep request"
          isLoading={isDeleting}
          onConfirm={() => void handleCancelRequest()}
          onCancel={() => setIsCancelConfirmOpen(false)}
        />
      ) : null}

      {pendingPath ? (
        <ConfirmationModal
          title="Leave without saving changes?"
          eyebrow="UNSAVED CHANGES"
          text="The changes you have made to this request have not been saved and will be lost."
          destructive
          confirmLabel="Discard changes"
          cancelLabel="Keep editing"
          onConfirm={() => {
            const destination = pendingPath;

            setPendingPath(null);

            if (request) {
              const restoredValues = toFormState(request);

              const restoredImage = request.productImage
                ? [toUploadFile(request.productImage, 'product-image')]
                : [];

              const restoredFiles = (request.additionalFiles ?? []).map(
                (file, index) => toUploadFile(file, `additional-${index}`)
              );

              setValues(restoredValues);
              setProductImage(restoredImage);
              setProductImagePreview(request.productImage?.dataUrl ?? null);
              setIsProductImageRemoved(false);
              setAdditionalFiles(restoredFiles);

              setSavedSignature(
                JSON.stringify({
                  values: restoredValues,
                  image: restoredImage.map((file) => [
                    file.documentId,
                    file.dataUrl,
                    file.name,
                  ]),

                  files: restoredFiles.map((file) => [
                    file.documentId,
                    file.name,
                    file.size,
                  ]),
                })
              );

              setValidationMode(null);
            }

            if (destination.startsWith('tab:'))
              setActiveEditorTab(destination.slice(4) as EditorTab);
            else router.push(destination);
          }}
          onCancel={() => setPendingPath(null)}
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
