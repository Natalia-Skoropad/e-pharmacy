import { PackageSearch } from 'lucide-react';

import {
  CommentInput,
  DocumentUpload,
  MarkdownTextarea,
  NameInput,
  SelectField,
} from '@e-pharmacy/ui/forms';

import { PharmacyPhotoPlaceholder, ShimmerImage } from '@e-pharmacy/ui/media';

import {
  PRODUCT_REQUEST_LIMITS,
  PRODUCT_REQUEST_ATTACHMENT_RULES,
  PRODUCT_REQUEST_ATTACHMENTS_ACCEPT,
  PRODUCT_REQUEST_IMAGE_ACCEPT,
} from '@e-pharmacy/validation/product-requests';

import type { ProductRequestFormValues } from '@e-pharmacy/validation/product-requests';

import { getProductRequestImageSrc } from '@/lib/product-requests/product-request-images';
import { adminApiRoutes } from '@/lib/api/routes/admin-api-routes';

import type {
  AdminRequestDetail,
  RequestTab,
} from '@/lib/product-requests/admin-product-request-detail';

import css from './AdminProductRequestPanels.module.css';

//===================================================================

const noop = () => undefined;

//===================================================================

export function AdminProductRequestPanels({
  request,
  tab,
}: {
  request: AdminRequestDetail;
  tab: RequestTab;
}) {
  const values = request.values;

  const image = getProductRequestImageSrc(
    request.image?.dataUrl ?? request.productImageUrl
  );

  const input = (
    key: keyof ProductRequestFormValues,
    label: string,
    required = false
  ) => (
    <NameInput
      id={`request-${key}`}
      name={key}
      label={label}
      value={values[key]}
      required={required}
      disabled
      onChange={noop}
    />
  );

  if (tab === 'product-data')
    return (
      <div className={css.editorPanel}>
        <div className={css.imageGrid}>
          <div className={css.imagePreview}>
            {image ? (
              <ShimmerImage
                src={image}
                alt={request.name}
                sizes="(min-width: 1440px) 420px, 90vw"
                unoptimized
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
              id="request-image"
              name="productImage"
              label="Product image"
              required
              value={request.image ? [request.image] : []}
              readOnly
              multiple={false}
              maxFiles={1}
              accept={PRODUCT_REQUEST_IMAGE_ACCEPT}
              hint="Product image submitted by the pharmacy owner."
              onChange={noop}
            />
          </div>
        </div>

        <div className={css.fieldGroup}>
          <div className={css.fieldsGrid}>
            {input('name', 'Product name', true)}
            {input('article', 'Product article', true)}
          </div>
        </div>

        <div className={css.fieldGroup}>
          <div className={css.fieldsGrid}>
            <SelectField
              id="request-category"
              label="Category"
              value={
                request.category?.id ??
                (values.categoryMode === 'custom' ? '__custom__' : '')
              }
              options={[
                { value: '', label: 'Not assigned' },
                ...(request.category
                  ? [
                      {
                        value: request.category.id,
                        label: request.category.name,
                      },
                    ]
                  : []),
                { value: '__custom__', label: 'Other category' },
              ]}
              disabled
              required
              onChange={noop}
            />
            {input(
              'customCategory',
              'Other category',
              values.categoryMode === 'custom'
            )}
          </div>
        </div>
      </div>
    );

  if (tab === 'characteristics')
    return (
      <div className={css.fieldGroups}>
        <div className={css.fieldGroup}>
          <div className={css.fieldsGrid}>
            {input('brand', 'Brand', true)}
            {input('series', 'Series / Line', true)}
          </div>
        </div>

        <div className={css.fieldGroup}>
          <div className={css.fieldsGrid}>
            {input('manufacturer', 'Manufacturer', true)}
            {input('releaseForm', 'Release form')}
          </div>
        </div>

        <div className={css.fieldGroup}>
          <div className={css.fieldsGrid}>
            {input('activeIngredients', 'Active ingredients')}
            {input('activeIngredientCount', 'Active ingredient count')}
          </div>
        </div>
      </div>
    );

  if (tab === 'about-product')
    return (
      <MarkdownTextarea
        id="request-description"
        name="fullDescription"
        expanded
        label="About product"
        value={values.fullDescription}
        maxLength={PRODUCT_REQUEST_LIMITS.fullDescriptionMax}
        disabled
        onValueChange={noop}
      />
    );

  if (tab === 'note-for-admin')
    return (
      <CommentInput
        id="request-note"
        name="pharmacyComment"
        className={css.noteField}
        label="Pharmacy note for Admin"
        value={values.pharmacyComment}
        maxLength={PRODUCT_REQUEST_LIMITS.pharmacyCommentMax}
        disabled
        onChange={noop}
      />
    );

  if (tab === 'documents')
    return (
      <DocumentUpload
        id="request-documents"
        name="additionalFiles"
        label="Files and documents"
        required
        readOnly
        value={request.files}
        maxFiles={PRODUCT_REQUEST_ATTACHMENT_RULES.maxFiles}
        accept={PRODUCT_REQUEST_ATTACHMENTS_ACCEPT}
        hint="Supporting documents submitted by the pharmacy owner. Admin access is read-only."
        onChange={noop}
        onDownloadFile={async (file) =>
          file.documentId
            ? `${adminApiRoutes.productRequests.details(request.id)}/documents/${encodeURIComponent(file.documentId)}`
            : ''
        }
      />
    );
  return null;
}
