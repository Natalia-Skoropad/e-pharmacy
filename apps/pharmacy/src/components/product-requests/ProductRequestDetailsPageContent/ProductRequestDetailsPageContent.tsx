'use client';

import { useEffect, useState } from 'react';
import {
  CalendarClock,
  FilePlus2,
  FileText,
  PackageCheck,
  Paperclip,
} from 'lucide-react';

import {
  ButtonLink,
  LoadingSpinner,
  ShimmerImage,
} from '@e-pharmacy/ui/common';

import { PageHeader } from '@e-pharmacy/ui/layout';
import { StatusBadge, StatusBanner } from '@e-pharmacy/ui/statistics';

import {
  PRODUCT_REQUEST_STATUS_LABELS,
  type PharmacyProductRequestDetails,
  type ProductRequestFile,
  type ProductRequestStatus,
} from '@e-pharmacy/types/product-requests';

import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/types/products';
import { formatOrderDateTime } from '@e-pharmacy/utils/formatters';

import { getPharmacyProductRequest } from '@/lib/api/browser';
import {
  getPharmacyAllProductPath,
  getPharmacyNewRequestPath,
  getPharmacyProductRequestsPath,
} from '@/lib/layout/routes';

import { getProductImageSrc } from '@/lib/products/product-images';

import {
  getLockedFeatureBannerLabel,
  getLockedFeatureBannerStatus,
  useCurrentPharmacyStatus,
} from '@/lib/pharmacies/current-pharmacy-status';

import css from './ProductRequestDetailsPageContent.module.css';

//===================================================================

type ProductRequestDetailsPageContentProps = Readonly<{
  requestId: string;
}>;

type RequestInformationItem = Readonly<{
  label: string;
  value?: string;
}>;

//===================================================================

const PRESCRIPTION_TYPE_LABELS: Record<string, string> = {
  prescription: 'Prescription only',
  non_prescription: 'Without prescription',
  not_applicable: 'Not applicable',
};

//===================================================================

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

//===================================================================

function getStatusMessage(status: ProductRequestStatus) {
  if (status === 'draft') {
    return {
      title: 'This request is saved as a draft',
      message:
        'The request has not been sent to Admin yet. Its submitted information is shown below.',
    };
  }

  if (status === 'new') {
    return {
      title: 'The request was sent for moderation',
      message:
        'Admin has received the request and will review the submitted product information.',
    };
  }

  if (status === 'in_progress') {
    return {
      title: 'Admin is reviewing this request',
      message:
        'The request is in work. Product information remains available here while moderation continues.',
    };
  }

  if (status === 'approved') {
    return {
      title: 'The product request was approved',
      message:
        'Admin created or linked the catalog product. Use the product link below to open its card.',
    };
  }

  return {
    title: 'The product request was rejected',
    message:
      'Review the submitted information and create a corrected request when the missing details are ready.',
  };
}

//===================================================================

function InformationList({
  items,
}: Readonly<{ items: RequestInformationItem[] }>) {
  const visibleItems = items.filter((item) => Boolean(item.value));

  if (!visibleItems.length) {
    return <p className={css.emptyText}>No information was provided.</p>;
  }

  return (
    <dl className={css.informationList}>
      {visibleItems.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

//===================================================================

function FileList({ files }: Readonly<{ files: ProductRequestFile[] }>) {
  if (!files.length) {
    return <p className={css.emptyText}>No additional files were attached.</p>;
  }

  return (
    <ul className={css.fileList}>
      {files.map((file, index) => (
        <li key={`${file.name}-${index}`}>
          <span className={css.fileIcon} aria-hidden="true">
            <FileText size={18} />
          </span>
          <span className={css.fileData}>
            <strong>{file.name}</strong>
            <small>
              {file.type || 'File'} · {formatFileSize(file.size)}
            </small>
          </span>
        </li>
      ))}
    </ul>
  );
}

//===================================================================

function ProductRequestDetailsPageContent({
  requestId,
}: ProductRequestDetailsPageContentProps) {
  const currentPharmacyStatus = useCurrentPharmacyStatus();
  const bannerStatus = getLockedFeatureBannerStatus(currentPharmacyStatus);
  const bannerLabel = bannerStatus
    ? getLockedFeatureBannerLabel(bannerStatus)
    : null;

  const [request, setRequest] =
    useState<PharmacyProductRequestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRequest() {
      try {
        const nextRequest = await getPharmacyProductRequest(requestId);
        if (!isMounted) return;

        setRequest(nextRequest);
        setHasError(false);
      } catch {
        if (!isMounted) return;

        setRequest(null);
        setHasError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadRequest();

    return () => {
      isMounted = false;
    };
  }, [requestId]);

  const pageTitle = request
    ? `Product request #${request.requestNumber}`
    : `Product request #${requestId}`;

  const statusMessage = request ? getStatusMessage(request.status) : null;
  const productImageSrc = request?.productImageUrl
    ? getProductImageSrc(request.productImageUrl)
    : null;

  const basicInformation: RequestInformationItem[] = request
    ? [
        { label: 'Product name', value: request.name },
        { label: 'Product article', value: request.article },
        {
          label: 'Category',
          value: PRODUCT_CATEGORY_LABELS[request.category],
        },
        { label: 'Manufacturer', value: request.manufacturer },
        { label: 'Country of origin', value: request.countryOfOrigin },
      ]
    : [];

  const productInformation: RequestInformationItem[] = request
    ? [
        { label: 'Dosage', value: request.dosage },
        { label: 'Package size', value: request.packageSize },
        { label: 'Form', value: request.form },
        { label: 'Active substance', value: request.activeSubstance },
        {
          label: 'Prescription type',
          value: request.prescriptionType
            ? (PRESCRIPTION_TYPE_LABELS[request.prescriptionType] ??
              request.prescriptionType)
            : undefined,
        },
        { label: 'Storage conditions', value: request.storageConditions },
      ]
    : [];

  return (
    <main className={css.page} aria-labelledby="product-request-details-title">
      <section className={css.contentCard}>
        <PageHeader
          title={pageTitle}
          titleId="product-request-details-title"
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
            label={bannerLabel ?? undefined}
            title="Product request management is locked for now"
            message="You can review the saved request details, but request actions become available after Admin verifies the pharmacy profile."
          />
        ) : null}
      </section>

      {isLoading ? (
        <section className={css.contentCard}>
          <div className={css.loaderBox}>
            <LoadingSpinner label="Loading product request..." />
          </div>
        </section>
      ) : null}

      {!isLoading && hasError ? (
        <section className={css.contentCard}>
          <StatusBanner
            status="rejected"
            title="Product request was not found"
            message="The request may have been removed, or it does not belong to the current pharmacy."
          />
        </section>
      ) : null}

      {!isLoading && request && statusMessage ? (
        <>
          <section className={css.contentCard}>
            <div className={css.statusRow}>
              <StatusBadge
                status={request.status}
                label={PRODUCT_REQUEST_STATUS_LABELS[request.status]}
              />

              <span className={css.updatedAt}>
                <CalendarClock size={16} aria-hidden="true" />
                Last updated {formatOrderDateTime(request.updatedAt)}
              </span>
            </div>

            <StatusBanner
              status={request.status}
              label={PRODUCT_REQUEST_STATUS_LABELS[request.status]}
              title={statusMessage.title}
              message={statusMessage.message}
            />

            <div className={css.requestActions}>
              {request.status === 'approved' && request.productId ? (
                <ButtonLink
                  href={getPharmacyAllProductPath(request.productId)}
                  size="sm"
                >
                  Open approved product
                </ButtonLink>
              ) : null}

              {request.status === 'draft' || request.status === 'rejected' ? (
                <ButtonLink
                  href={getPharmacyNewRequestPath()}
                  variant="secondary"
                  size="sm"
                >
                  Create another request
                </ButtonLink>
              ) : null}
            </div>
          </section>

          <section className={css.detailsGrid} aria-label="Request summary">
            <div className={css.imageCard}>
              {productImageSrc ? (
                <ShimmerImage
                  className={css.productImage}
                  src={productImageSrc}
                  alt={request.name}
                  sizes="(min-width: 1024px) 360px, 90vw"
                  unoptimized
                />
              ) : (
                <div className={css.imagePlaceholder}>
                  <PackageCheck size={42} aria-hidden="true" />
                  <strong>{request.name}</strong>
                  <span>Product image is not available</span>
                </div>
              )}

              {request.productImage ? (
                <div className={css.uploadedImageFile}>
                  <Paperclip size={16} aria-hidden="true" />
                  <span>
                    Uploaded image: <strong>{request.productImage.name}</strong>
                  </span>
                </div>
              ) : null}
            </div>

            <section className={css.detailCard} aria-labelledby="basic-info-title">
              <div className={css.sectionHeading}>
                <p>Request data</p>
                <h2 id="basic-info-title">Basic information</h2>
              </div>

              <InformationList items={basicInformation} />

              <div className={css.dateGrid}>
                <div>
                  <span>Created</span>
                  <strong>{formatOrderDateTime(request.createdAt)}</strong>
                </div>
                <div>
                  <span>Last updated</span>
                  <strong>{formatOrderDateTime(request.updatedAt)}</strong>
                </div>
              </div>
            </section>
          </section>

          <section className={css.contentCard} aria-labelledby="product-data-title">
            <div className={css.sectionHeading}>
              <p>Product data</p>
              <h2 id="product-data-title">Characteristics</h2>
            </div>

            <InformationList items={productInformation} />
          </section>

          <section className={css.textSections} aria-label="Request descriptions">
            <article className={css.textCard}>
              <h2>Short description</h2>
              <p>{request.shortDescription || 'No short description provided.'}</p>
            </article>

            <article className={css.textCard}>
              <h2>Full description</h2>
              <p>{request.fullDescription || 'No full description provided.'}</p>
            </article>

            <article className={css.textCard}>
              <h2>Characteristics</h2>
              <p>{request.characteristics || 'No characteristics provided.'}</p>
            </article>

            <article className={css.textCard}>
              <h2>Pharmacy comment</h2>
              <p>{request.pharmacyComment || 'No pharmacy comment provided.'}</p>
            </article>
          </section>

          <section className={css.contentCard} aria-labelledby="files-title">
            <div className={css.sectionHeadingWithIcon}>
              <Paperclip size={20} aria-hidden="true" />
              <div className={css.sectionHeading}>
                <p>Documents</p>
                <h2 id="files-title">Additional files</h2>
              </div>
            </div>

            <FileList files={request.additionalFiles ?? []} />
          </section>
        </>
      ) : null}
    </main>
  );
}

export default ProductRequestDetailsPageContent;
export { ProductRequestDetailsPageContent };
