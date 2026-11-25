'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import {
  ClipboardList,
  FileText,
  Files,
  PackageSearch,
  Package,
  StickyNote,
  History,
  ClipboardCheck,
  ChevronDown,
  CircleHelp,
  MessageSquareText,
  LogOut,
  CheckCircle2,
  FilePlus2,
  Save,
  Send,
  Settings,
  Trash2,
  X,
} from 'lucide-react';

import { Button, LoadingSpinner } from '@e-pharmacy/ui/primitives';
import { CategoryIcon, type SelectOption } from '@e-pharmacy/ui/forms';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import type { BrowserUploadFile } from '@e-pharmacy/ui/forms';

import {
  readFileAsDataUrl,
  uploadManagedPhotoDetails,
} from '@e-pharmacy/ui/media';

import { useToast } from '@e-pharmacy/ui/feedback';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatusBanner } from '@e-pharmacy/ui/statistics';

import { PRODUCT_REQUEST_ERROR_CODES } from '@e-pharmacy/config/product-requests';
import { isApiError } from '@e-pharmacy/api-client/transport';
import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';

import type {
  ProductRequestFormPayload,
  ProductRequestFile,
} from '@e-pharmacy/types/product-requests';

import {
  PRODUCT_REQUEST_IMAGE_RULES,
  PRODUCT_REQUEST_INITIAL_VALUES,
  PRODUCT_REQUEST_ARTICLE_PATTERN,
  PRODUCT_REQUEST_VALIDATION_MESSAGES,
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
  createPharmacyProductRequest,
  deletePharmacyProductRequest,
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

import {
  ProductRequestEditorPanels,
  type ProductRequestEditorTab,
} from './ProductRequestEditorPanels';

import { ProductRequestModerationModal } from './ProductRequestModerationModal';
import { ProductRequestSectionState } from './ProductRequestSectionState';
import { ProductRequestDetailSections } from './ProductRequestDetailSections';
import { ProductRequestOverview } from '../ProductRequestDetailsPageContent/ProductRequestOverview';
import { uploadProductRequestDocuments } from './product-request-document-upload';
import { getProductRequestEditorSignature } from './product-request-editor-signature';
import { useUnsavedProductRequestNavigation } from './useUnsavedProductRequestNavigation';
import { resolveProductRequestPageMode } from './product-request-page-mode';

import css from './NewProductRequestPageContent.module.css';

//===================================================================

const CUSTOM_CATEGORY_OPTION_VALUE = '__custom__';

//===================================================================

type ValidationMode = ProductRequestValidationMode | null;

type EditorTab = ProductRequestEditorTab;

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
  initialTab = requestId ? 'details' : 'product-data',
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

  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [loadError, setLoadError] = useState<ProductRequestLoadError | null>(
    null
  );

  const [newRequestTab, setNewRequestTab] = useState<EditorTab>('product-data');

  // Existing request tabs are route-owned, including browser Back/Forward.
  const activeEditorTab = requestId ? initialTab : newRequestTab;

  const [savedSignature, setSavedSignature] = useState(() =>
    getProductRequestEditorSignature(PRODUCT_REQUEST_INITIAL_VALUES, [], [])
  );

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

  const currentSignature = getProductRequestEditorSignature(
    values,
    productImage,
    additionalFiles
  );

  // A new (not yet saved) draft also needs the unsaved-changes confirmation.
  const isDirty = canEdit && !isLoading && savedSignature !== currentSignature;

  const { pendingPath, setPendingPath, allowNavigationRef } =
    useUnsavedProductRequestNavigation(isDirty, pathname);

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
      ...(requestId
        ? [
            {
              value: 'details' as const,
              label: 'Details',
              icon: <PackageSearch size={17} aria-hidden="true" />,
            },
          ]
        : []),
      {
        value: 'product-data',
        label: 'Product data',
        icon: <Package size={17} aria-hidden="true" />,
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
              icon: <MessageSquareText size={17} aria-hidden="true" />,
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
      } finally {
        if (!controller.signal.aborted && !requestId && !cloneSourceRequestId) {
          setIsLoading(false);
        }
      }
    }

    void loadCategories();

    return () => controller.abort();
  }, [cloneSourceRequestId, requestId, loadAttempt]);

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
          getProductRequestEditorSignature(
            toFormState(loadedRequest),
            loadedRequest.productImage
              ? [toUploadFile(loadedRequest.productImage, 'product-image')]
              : [],
            (loadedRequest.additionalFiles ?? []).map((file, index) =>
              toUploadFile(file, `additional-${index}`)
            )
          )
        );

        if (requestId) {
          setRequest(loadedRequest);
          setCommentsTotal(loadedRequest.commentsTotal);
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
  }, [cloneSourceRequestId, requestId, loadAttempt]);

  // A retained request component must republish its label for each tab URL.
  useEffect(() => {
    if (requestId && request?.name) {
      dispatchPharmacyBreadcrumbLabel(request.name);
    }
  }, [pathname, requestId, request?.name]);

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
    setAdditionalFilesError('');

    try {
      const filesWithData = await uploadProductRequestDocuments(
        files,
        controller.signal,

        async (file) => {
          const dataUrl =
            file.dataUrl ??
            (await readFileAsDataUrl(file.file!, controller.signal));

          if (controller.signal.aborted) {
            throw new DOMException('Upload aborted', 'AbortError');
          }

          const fileMetadata = toProductRequestFileMetadata(file);

          const uploaded = await uploadPharmacyProductRequestDocument({
            name: fileMetadata.name,
            type: fileMetadata.type,
            size: fileMetadata.size,
            dataUrl,
          });

          return {
            id: uploaded.document.documentId,
            documentId: uploaded.document.documentId,
            name: uploaded.document.name,
            type: uploaded.document.type,
            size: uploaded.document.size,
          };
        },
        setAdditionalFiles
      );

      if (!filesWithData || controller.signal.aborted) return;

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
      if (
        !controller.signal.aborted &&
        !(error instanceof DOMException && error.name === 'AbortError')
      ) {
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

        const savedValues = toFormState(updatedRequest);

        const savedImage = updatedRequest.productImage
          ? [toUploadFile(updatedRequest.productImage, 'product-image')]
          : [];

        const savedFiles = (updatedRequest.additionalFiles ?? []).map(
          (file, index) => toUploadFile(file, `additional-${index}`)
        );

        setValues(savedValues);
        setProductImage(savedImage);
        setAdditionalFiles(savedFiles);
        setProductImagePreview(updatedRequest.productImage?.dataUrl ?? null);
        setIsProductImageRemoved(false);

        setSavedSignature(
          getProductRequestEditorSignature(savedValues, savedImage, savedFiles)
        );

        toast.success('Changes saved.');
        router.refresh();

        return;
      }

      const createdRequest = await createPharmacyProductRequest(
        buildPayload('new')
      );

      toast.success('New request saved. You can continue editing it.');
      allowNavigationRef.current = true;
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
      !request ||
      !canSubmitSaved ||
      !isModerationReady ||
      mutationLockRef.current
    )
      return;

    mutationLockRef.current = true;
    setSavingStatus('moderation');

    try {
      const result = await submitPharmacyProductRequest(request);

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
    if (!requestId || !request || mutationLockRef.current) return;

    mutationLockRef.current = true;
    setIsDeleting(true);

    try {
      const result = await cancelPharmacyProductRequest(request);

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
      allowNavigationRef.current = true;
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
      const target = event.target;

      if (!(target instanceof Element)) return;
      if (statusMenuRef.current?.contains(target)) return;

      // The scrollable requirements tooltip is portalled outside the menu.
      const tooltip = target.closest('[role="tooltip"]');

      if (
        tooltip?.id &&
        Array.from(
          statusMenuRef.current?.querySelectorAll('[aria-describedby]') ?? []
        ).some(
          (trigger) => trigger.getAttribute('aria-describedby') === tooltip.id
        )
      ) {
        return;
      }

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

  const pageTitle =
    request?.name ??
    (requestId
      ? 'Product request'
      : requestMode === 'clone'
        ? 'New product request from rejected request'
        : 'New product request');

  const savedImageSrc = request?.productImageUrl
    ? getProductImageSrc(request.productImageUrl)
    : null;

  const displayedImageSrc: string | null = isProductImageRemoved
    ? null
    : (productImagePreview ?? savedImageSrc ?? null);

  const hasHeaderActions = Boolean(
    request || (!requestId && canEdit && !isLoading && !loadError)
  );

  const canModerate =
    request?.status === 'new' ||
    (request?.status === 'on_moderation' &&
      request.reviewState === 'changes_requested');

  const showStatusMenu = Boolean(requestId && request);
  const isSendDisabled = !canModerate || !isModerationReady || !canSubmitSaved;

  const onEditorTabChange = (tab: EditorTab) => {
    if (tab === activeEditorTab) return;

    const url = requestId
      ? tab === 'details'
        ? getPharmacyRequestPath(requestId)
        : `${getPharmacyRequestPath(requestId)}/${tab === 'full-description' ? 'about-product' : tab}`
      : '';

    // Existing request tabs have their own routes. Leaving one with pending
    // edits can remount the editor, so use the same unsaved-changes guard.
    // A new unsaved request has in-page tabs and keeps its values intact.
    if (url && isDirty) {
      setPendingPath(url);
      return;
    }

    if (url) router.push(url, { scroll: false });
    else setNewRequestTab(tab);
  };

  const titleLastSpace = pageTitle.lastIndexOf(' ');

  const titlePrefix =
    titleLastSpace >= 0 ? pageTitle.slice(0, titleLastSpace) : '';

  const titleEnd =
    titleLastSpace >= 0 ? pageTitle.slice(titleLastSpace + 1) : pageTitle;

  const saveAction = canEdit ? (
    <Button
      className={css.saveAction}
      type="button"
      isLoading={savingStatus === 'new'}
      disabled={!canSaveDraft}
      iconLeft={<Save size={17} aria-hidden="true" />}
      onClick={handleSaveDraft}
    >
      {requestId ? 'Save changes' : 'Save draft'}
    </Button>
  ) : undefined;

  const headerActions = (
    <div className={css.headerActions}>
      {!requestId ? saveAction : null}
      {showStatusMenu ? (
        <div className={css.statusMenu} ref={statusMenuRef}>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={request?.status === 'approved' || isMutating}
            aria-haspopup="menu"
            aria-expanded={statusMenuOpen}
            aria-controls="request-status-actions-menu"
            iconLeft={<ClipboardCheck size={17} aria-hidden="true" />}
            onClick={() => setStatusMenuOpen((open) => !open)}
          >
            Manage request status <ChevronDown size={16} aria-hidden="true" />
          </Button>

          {statusMenuOpen && request?.status !== 'approved' ? (
            <div
              className={css.statusMenuOptions}
              id="request-status-actions-menu"
              role="menu"
              aria-label="Available request actions"
            >
              {request?.status === 'rejected' ? (
                <button
                  type="button"
                  role="menuitem"
                  className={css.sendStatusAction}
                  onClick={() => {
                    setStatusMenuOpen(false);
                    router.push(
                      `${PHARMACY_ROUTES.PRODUCT_REQUEST_NEW}?source=${request.id}`
                    );
                  }}
                >
                  <FilePlus2 size={17} aria-hidden="true" /> Create new based on
                  rejected
                </button>
              ) : (
                <>
                  <div className={css.statusActionRow}>
                    <button
                      type="button"
                      role="menuitem"
                      className={css.moderationStatusAction}
                      disabled={isSendDisabled}
                      onClick={() => {
                        setStatusMenuOpen(false);
                        handleSendForModeration();
                      }}
                    >
                      <Send size={17} aria-hidden="true" />{' '}
                      {request?.status === 'on_moderation'
                        ? 'Resend for moderation'
                        : 'Send for moderation'}
                    </button>
                    {isSendDisabled ? (
                      <span className={css.statusActionTooltip}>
                        <InfoTooltip
                          label="Why this action is unavailable"
                          title="Moderation requirements"
                          icon={<ClipboardCheck size={20} aria-hidden="true" />}
                          escapeOverflow
                          scrollable
                          items={[
                            {
                              title: 'Required action',
                              description: !canModerate
                                ? 'This request is being reviewed. You can submit it again after Admin requests corrections.'
                                : isMutating || isFileProcessing
                                  ? 'Wait until the current operation finishes.'
                                  : isDirty
                                    ? 'Save your changes before sending the request.'
                                    : 'Provide a photo, unique article, category, brand, series, manufacturer, at least one document, and an About product text of at least 100 characters.',
                              icon: <CircleHelp size={16} aria-hidden="true" />,
                            },
                          ]}
                        />
                      </span>
                    ) : null}
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
                      <Trash2 size={17} aria-hidden="true" /> Delete request
                      draft
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
                </>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (!requestId && isLoading) {
    return (
      <main className={css.page} aria-label="Loading product request">
        <section className={css.contentCard}>
          <div className={css.loaderBox}>
            <LoadingSpinner label="Preparing product request..." />
          </div>
        </section>
      </main>
    );
  }

  if (!requestId && loadError) {
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
          actionsLayout="responsive"
          title={
            <span className={css.titleWithTooltip}>
              {titlePrefix ? `${titlePrefix} ` : null}
              <span className={css.titleEnding}>
                {titleEnd}
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
                          'Before moderation, add a product photo, at least one document, unique article, category, brand, series, manufacturer, and an About product description of at least 100 characters.',
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
            </span>
          }
          titleId="product-request-page-title"
          icon={<FilePlus2 size={23} aria-hidden="true" />}
          actions={hasHeaderActions ? headerActions : undefined}
        />
      </section>

      <section className={css.editorCard} aria-label="Product request sections">
        <Tabs
          idBase="product-request-editor"
          items={editorTabs}
          activeValue={activeEditorTab}
          ariaLabel="Product request editor sections"
          mobileVisibleCount={1}
          tabletVisibleCount={requestId ? 4 : 3}
          onChange={onEditorTabChange}
        />

        {request?.reviewState === 'changes_requested' &&
        request.rejectionReason ? (
          <StatusBanner
            tone="warning"
            label="Needs changes"
            title="Admin feedback"
            message={request.rejectionReason}
          />
        ) : null}

        {requestId &&
        (loadError || (isLoading && activeEditorTab !== 'comments')) ? (
          <ProductRequestSectionState
            tab={activeEditorTab}
            error={loadError}
            onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
          />
        ) : activeEditorTab === 'details' && request ? (
          <ProductRequestOverview
            request={request}
            categoryDirectory={productCategories}
          />
        ) : activeEditorTab !== 'comments' && activeEditorTab !== 'activity' ? (
          <form
            className={css.form}
            noValidate
            onSubmit={(event) => event.preventDefault()}
          >
            <ProductRequestEditorPanels
              activeEditorTab={activeEditorTab}
              saveAction={requestId ? saveAction : undefined}
              values={values}
              errors={errors}
              validationMode={validationMode}
              canEdit={canEdit}
              isMutating={isMutating}
              isFileProcessing={isFileProcessing}
              displayedImageSrc={displayedImageSrc}
              productImage={productImage}
              productImageError={productImageError}
              articleCheckStatus={articleCheckStatus}
              articleFormatError={articleFormatError}
              categoryOptions={categoryOptions}
              selectedCategoryValue={selectedCategoryValue}
              additionalFiles={additionalFiles}
              additionalFilesError={additionalFilesError}
              requestId={requestId}
              cloneSourceRequestId={cloneSourceRequestId}
              updateValue={updateValue}
              handleProductImageChange={handleProductImageChange}
              handleAdditionalFilesChange={handleAdditionalFilesChange}
              setAdditionalFilesError={setAdditionalFilesError}
            />
          </form>
        ) : (
          <ProductRequestDetailSections
            activeEditorTab={activeEditorTab}
            request={request}
            requestId={requestId}
            commentsTotal={commentsTotal}
            onCommentsTotalChange={setCommentsTotal}
          />
        )}
      </section>

      {isModerationConfirmOpen ? (
        <ProductRequestModerationModal
          status={request?.status ?? 'new'}
          needsChanges={request?.reviewState === 'changes_requested'}
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
          title="Leave product request editor?"
          eyebrow="UNSAVED CHANGES"
          text="The changes you have made to this request have not been saved and will be lost."
          destructive
          confirmLabel="Leave page"
          cancelLabel="Keep editing"
          confirmIconLeft={<LogOut size={17} aria-hidden="true" />}
          cancelIconLeft={<X size={17} aria-hidden="true" />}
          onConfirm={() => {
            const destination = pendingPath;

            setPendingPath(null);
            imageReadControllerRef.current?.abort();
            additionalFilesReadControllerRef.current?.abort();
            imageReadControllerRef.current = null;
            additionalFilesReadControllerRef.current = null;
            setIsImageProcessing(false);
            setIsAdditionalFilesProcessing(false);
            setProductImageError('');
            setAdditionalFilesError('');

            const restoredValues = request
              ? toFormState(request)
              : PRODUCT_REQUEST_INITIAL_VALUES;

            const restoredImage = request?.productImage
              ? [toUploadFile(request.productImage, 'product-image')]
              : [];

            const restoredFiles = (request?.additionalFiles ?? []).map(
              (file, index) => toUploadFile(file, `additional-${index}`)
            );

            setValues(restoredValues);
            setProductImage(restoredImage);
            setProductImagePreview(request?.productImage?.dataUrl ?? null);
            setIsProductImageRemoved(false);
            setAdditionalFiles(restoredFiles);

            setSavedSignature(
              getProductRequestEditorSignature(
                restoredValues,
                restoredImage,
                restoredFiles
              )
            );

            setValidationMode(null);
            allowNavigationRef.current = true;
            router.push(destination);
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
          eyebrow="PRODUCT REQUEST STATUS"
          title="Delete product request draft?"
          destructive
          confirmIconLeft={<Trash2 size={17} aria-hidden="true" />}
          cancelIconLeft={<X size={17} aria-hidden="true" />}
          closeOnBackdrop={!isDeleting}
          closeOnEscape={!isDeleting}
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
