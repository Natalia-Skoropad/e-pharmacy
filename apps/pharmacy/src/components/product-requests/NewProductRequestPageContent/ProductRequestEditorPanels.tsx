import type { ReactNode } from 'react';

import {
  ClipboardList,
  FileText,
  Files,
  Package,
  PackageSearch,
  StickyNote,
} from 'lucide-react';

import type { BrowserUploadFile, SelectOption } from '@e-pharmacy/ui/forms';

import {
  CommentInput,
  DocumentUpload,
  MarkdownTextarea,
  NameInput,
  SelectField,
} from '@e-pharmacy/ui/forms';

import { PharmacyPhotoPlaceholder } from '@e-pharmacy/ui/media';
import { ProfileSectionHeader } from '@e-pharmacy/ui/profile';

import {
  PRODUCT_REQUEST_ATTACHMENT_MAX_SIZE_MB,
  PRODUCT_REQUEST_ATTACHMENTS_ACCEPT,
  PRODUCT_REQUEST_ATTACHMENT_RULES,
  PRODUCT_REQUEST_IMAGE_ACCEPT,
  PRODUCT_REQUEST_IMAGE_RULES,
  PRODUCT_REQUEST_LIMITS,
  normalizeProductRequestLatinInput,
  normalizeProductRequestArticleInput,
  validateProductRequestAdditionalFiles,
  validateProductRequestImageFile,
  type ProductRequestFormErrors,
  type ProductRequestFormValues,
  type ProductRequestValidationMode,
} from '@e-pharmacy/validation/product-requests';

import css from './ProductRequestEditorPanels.module.css';

//===================================================================

const CUSTOM_CATEGORY_OPTION_VALUE = '__custom__';

//===================================================================

export type ProductRequestEditorTab =
  | 'details'
  | 'product-data'
  | 'characteristics'
  | 'full-description'
  | 'note-for-admin'
  | 'documents'
  | 'comments'
  | 'activity';

//===================================================================

export type ProductRequestEditorPanelsProps = Readonly<{
  activeEditorTab: ProductRequestEditorTab;
  saveAction?: ReactNode;
  values: ProductRequestFormValues;
  errors: ProductRequestFormErrors;
  validationMode: ProductRequestValidationMode | null;
  canEdit: boolean;
  isMutating: boolean;
  isFileProcessing: boolean;
  displayedImageSrc: string | null;
  productImage: BrowserUploadFile[];
  productImageError: string;
  articleCheckStatus: 'idle' | 'checking' | 'available' | 'conflict' | 'error';
  articleFormatError: string;
  categoryOptions: SelectOption<string>[];
  selectedCategoryValue: string;
  additionalFiles: BrowserUploadFile[];
  additionalFilesError: string;
  requestId?: string;
  cloneSourceRequestId?: string;

  updateValue: <TField extends keyof ProductRequestFormValues>(
    field: TField,
    value: ProductRequestFormValues[TField]
  ) => void;

  handleProductImageChange: (files: BrowserUploadFile[]) => Promise<void>;
  handleAdditionalFilesChange: (files: BrowserUploadFile[]) => Promise<void>;
  setAdditionalFilesError: (value: string) => void;
}>;

//===================================================================

export function ProductRequestEditorPanels({
  activeEditorTab,
  saveAction,
  values,
  errors,
  validationMode,
  canEdit,
  isMutating,
  isFileProcessing,
  displayedImageSrc,
  productImage,
  productImageError,
  articleCheckStatus,
  articleFormatError,
  categoryOptions,
  selectedCategoryValue,
  additionalFiles,
  additionalFilesError,
  requestId,
  cloneSourceRequestId,
  updateValue,
  handleProductImageChange,
  handleAdditionalFilesChange,
  setAdditionalFilesError,
}: ProductRequestEditorPanelsProps) {
  return (
    <>
      {activeEditorTab === 'product-data' ? (
        <section
          className={css.editorPanel}
          aria-labelledby="product-data-title"
        >
          <ProfileSectionHeader
            action={saveAction}
            title="Product data"
            titleId="product-data-title"
            description="Add the product name and details for Admin review. Only a valid name is required for saving a draft."
            icon={<Package size={21} aria-hidden="true" />}
          />

          <div className={css.imageGrid}>
            <div className={css.imagePreview}>
              {displayedImageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayedImageSrc} alt="Selected product preview" />
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

                  if (!file.file) return validateProductRequestImageFile(file);

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
                  removeAriaLabel: (fileName) => `Remove image ${fileName}`,
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
                      normalizeProductRequestLatinInput(event.target.value)
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
                      normalizeProductRequestArticleInput(event.target.value)
                    )
                  }
                />
              </div>
            </div>

            <div className={css.fieldGroup}>
              <div className={`${css.fieldsGrid} ${css.categoryFieldsGrid}`}>
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
                    values.categoryMode === 'custom' && Boolean(validationMode)
                  }
                  required={values.categoryMode === 'custom'}
                  maxLength={PRODUCT_REQUEST_LIMITS.customCategoryMax}
                  disabled={!canEdit || values.categoryMode !== 'custom'}
                  autoComplete="off"
                  onChange={(event) =>
                    updateValue(
                      'customCategory',
                      normalizeProductRequestLatinInput(event.target.value)
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
            action={saveAction}
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
                      normalizeProductRequestLatinInput(event.target.value)
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
                      normalizeProductRequestLatinInput(event.target.value)
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
                      normalizeProductRequestLatinInput(event.target.value)
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
                      normalizeProductRequestLatinInput(event.target.value)
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
                      normalizeProductRequestLatinInput(event.target.value)
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
                  maxLength={PRODUCT_REQUEST_LIMITS.activeIngredientCountMax}
                  disabled={!canEdit}
                  autoComplete="off"
                  onChange={(event) =>
                    updateValue(
                      'activeIngredientCount',
                      normalizeProductRequestLatinInput(event.target.value)
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
            action={saveAction}
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
            action={saveAction}
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
        <section className={css.editorPanel} aria-labelledby="documents-title">
          <ProfileSectionHeader
            action={saveAction}
            title="Documents"
            titleId="documents-title"
            description="Attach at least one supporting document before sending the request for moderation. Drafts can be saved without documents."
            icon={<Files size={21} aria-hidden="true" />}
          />

          <DocumentUpload
            id="product-request-documents"
            name="additionalFiles"
            label="Files and documents"
            required
            value={additionalFiles}
            error={additionalFilesError || errors.additionalFiles}
            isTouched={Boolean(additionalFilesError || errors.additionalFiles)}
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
    </>
  );
}
