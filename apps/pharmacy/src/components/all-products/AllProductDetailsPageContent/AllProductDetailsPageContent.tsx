'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  ArrowRight,
  ClipboardList,
  MessageSquareText,
  PackageSearch,
  Plus,
} from 'lucide-react';

import type { ProductDetails } from '@e-pharmacy/types/products';
import type { Review } from '@e-pharmacy/types/reviews';
import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';

import { PRODUCT_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { PRODUCT_MANAGEMENT_ERROR_CODES } from '@e-pharmacy/config/products';

import { LinkButton, Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import { RatingSummary, ReviewsList } from '@e-pharmacy/ui/data-display';
import { Button } from '@e-pharmacy/ui/primitives';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import { CategoryIcon } from '@e-pharmacy/ui/forms';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { useToast } from '@e-pharmacy/ui/feedback';

import { isApiError } from '@e-pharmacy/api-client/transport';
import { formatShortDate } from '@e-pharmacy/utils/date';

import { getOwnedPharmacyStatistics } from '@/lib/api/browser/owned-pharmacy-registry.api';
import { getProductCategories } from '@/lib/api/browser';

import {
  getOwnerCatalogProductDetails,
  getOwnerCatalogProductReviews,
  addOwnerCatalogProduct,
} from '@/lib/api/browser/owner-all-products.api';

import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';
import { dispatchPharmacyBreadcrumbLabel } from '@/lib/layout/breadcrumbs';
import { getProductImageSrc } from '@/lib/products/product-images';
import { resolveOwnerCatalogCategory } from '@/lib/products/owner-catalog-category';

import { getPharmacyProductPath } from '@/lib/routes';

import {
  getAllProductDetailTabPath,
  parseAllProductDetailTabPath,
  type AllProductDetailTab,
} from '@/lib/products/all-product-detail-tabs';

import { OwnerAddProductConfirmation } from '@/components/all-products/OwnerAddProductConfirmation/OwnerAddProductConfirmation';

import css from './AllProductDetailsPageContent.module.css';

//===================================================================

const TABS: Array<TabItem<AllProductDetailTab>> = [
  { value: 'details', label: 'Details', icon: <PackageSearch size={17} /> },
  {
    value: 'characteristics',
    label: 'Characteristics',
    icon: <ClipboardList size={17} />,
  },
  { value: 'reviews', label: 'Reviews', icon: <MessageSquareText size={17} /> },
];

//===================================================================

function getLoadError(error: unknown) {
  if (isApiError(error) && [400, 404, 422].includes(error.httpStatus ?? 0)) {
    return {
      title: 'Product not found',
      message: 'This product does not exist or the link is invalid.',
    };
  }

  if (isApiError(error) && error.httpStatus === 403) {
    return {
      title: 'Product is unavailable',
      message: 'You do not have access to this product.',
    };
  }

  return {
    title: 'Product could not be loaded',
    message: getSafeApiErrorMessage(
      error,
      'Could not load product data. Please try again.'
    ),
  };
}

//===================================================================

function CatalogTabHeading({ tab }: { tab: AllProductDetailTab }) {
  const presentation = {
    details: {
      title: 'Product details',

      description:
        'Review the Admin catalog details and product availability for your pharmacies.',

      icon: <PackageSearch size={21} />,
    },

    characteristics: {
      title: 'Characteristics',

      description:
        'Review the main product properties supplied in the Admin catalog.',

      icon: <ClipboardList size={21} />,
    },

    reviews: {
      title: 'Reviews',
      description: 'Read approved client reviews for this product.',
      icon: <MessageSquareText size={21} />,
    },
  };

  return <ProfileSectionHeader {...presentation[tab]} />;
}

//===================================================================

function CatalogCharacteristics({ product }: { product: ProductDetails }) {
  const characteristics = [
    product.manufacturer
      ? { label: 'Manufacturer', value: product.manufacturer }
      : null,

    product.dosage ? { label: 'Dosage', value: product.dosage } : null,

    product.packageQuantity
      ? { label: 'Package', value: product.packageQuantity }
      : null,
    { label: 'Category', value: product.category.name },
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <>
      {characteristics.length ? (
        <dl className={css.characteristicsList}>
          {characteristics.map((item) => (
            <div className={css.characteristicItem} key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={css.emptyPanel}>
          Characteristics for this product have not been added yet.
        </p>
      )}
      <div className={css.descriptionBlock}>
        {product.description ? <p>{product.description}</p> : null}
        <p>
          Before purchasing, compare pharmacy prices, check the available
          quantity, read client reviews, and make sure the selected offer
          matches your needs. Information on this page helps clients quickly
          understand the product, its main properties, and where it can be
          bought online.
        </p>
      </div>
    </>
  );
}

//===================================================================

function CatalogReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );

  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    queueMicrotask(() => {
      if (!controller.signal.aborted) setStatus('loading');
    });

    void getOwnerCatalogProductReviews(productId, { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) {
          setReviews([...response.items]);
          setStatus('success');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });

    return () => controller.abort();
  }, [productId, retry]);

  if (status === 'error')
    return (
      <ProfileResourceState
        variant="error"
        title="Reviews are temporarily unavailable"
        description="Could not load product reviews. Please try again later."
        retryLabel="Try again"
        onRetry={() => setRetry((value) => value + 1)}
        sideActionOnDesktop
      />
    );

  if (status !== 'success')
    return (
      <ProfileResourceState
        variant="loading"
        title="Loading product reviews"
        description="Approved client reviews for this product are being loaded."
      />
    );

  return (
    <ReviewsList
      reviews={reviews.map((review) => ({
        id: String(review.id),
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      }))}
      title={null}
      emptyVariant="resource"
      emptyTitle="This product has no reviews yet."
      emptyText="Product reviews will appear here after clients share their feedback."
    />
  );
}

//===================================================================

function AllProductDetailsPageContent({
  productId,
}: Readonly<{ productId: string }>) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  const activeTab =
    parseAllProductDetailTabPath(pathname, productId) ?? 'details';

  const [product, setProduct] = useState<ProductDetails | null>(null);

  const [categoryDirectory, setCategoryDirectory] = useState<
    readonly ProductCategoryReference[]
  >([]);

  const [ownerHasEligiblePharmacies, setOwnerHasEligiblePharmacies] =
    useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<ReturnType<typeof getLoadError> | null>(
    null
  );

  const [retry, setRetry] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void getOwnedPharmacyStatistics({ signal: controller.signal })
      .then((summary) => {
        if (!controller.signal.aborted)
          setOwnerHasEligiblePharmacies(
            summary.active + summary.onModeration > 0
          );
      })
      .catch(() => {
        if (!controller.signal.aborted) setOwnerHasEligiblePharmacies(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void getProductCategories({ signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) setCategoryDirectory(items);
      })
      .catch(() => {
        /* Keep the category label returned by the product endpoint. */
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setIsLoading(true);
        setProduct(null);
        setError(null);
      }
    });

    void getOwnerCatalogProductDetails(productId, { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setProduct(response.product);
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(getLoadError(loadError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [productId, retry]);

  useEffect(() => {
    if (product?.name) dispatchPharmacyBreadcrumbLabel(product.name);
  }, [product?.name, pathname]);

  const isAdded = Boolean(product?.isAddedToOwner);

  const canAdd = Boolean(
    product &&
    product.status === 'active' &&
    !isAdded &&
    ownerHasEligiblePharmacies
  );

  async function confirmAdd() {
    if (!product || !canAdd) return;

    setIsAddingProduct(true);

    try {
      const response = await addOwnerCatalogProduct(product.id);

      setProduct({ ...response.product, isAddedToOwner: true });
      setIsAddModalOpen(false);
      toast.success(response.message || 'Product added to your pharmacy.');
    } catch (addError) {
      const message = getSafeApiErrorMessage(
        addError,
        'Product action could not be completed. Please try again.',
        {
          backendMessages: {
            [PRODUCT_MANAGEMENT_ERROR_CODES.PHARMACY_NOT_FOUND]:
              'Pharmacy profile is unavailable for this account.',

            [PRODUCT_MANAGEMENT_ERROR_CODES.PHARMACY_LOCKED]:
              'Product management is unavailable until Admin verifies the pharmacy.',

            [PRODUCT_MANAGEMENT_ERROR_CODES.PRODUCT_BLOCKED]:
              'Blocked products cannot be added to your pharmacy.',

            [PRODUCT_MANAGEMENT_ERROR_CODES.ALREADY_ADDED]:
              'This product is already added to your pharmacy.',
          },
        }
      );
      if (message) toast.error(message);
    } finally {
      setIsAddingProduct(false);
    }
  }

  return (
    <main className={css.page} aria-labelledby="global-product-page-title">
      <section className={css.contentCard}>
        <div className={css.stack}>
          <div className={css.titleBlock}>
            <PageHeader
              title={product?.name ?? error?.title ?? 'Global product'}
              titleId="global-product-page-title"
              icon={<PackageSearch size={23} aria-hidden="true" />}
            />
            {product ? (
              <RatingSummary
                className={css.titleRating}
                rating={product.rating}
                reviewsCount={product.reviewsCount}
              />
            ) : null}
          </div>
        </div>
      </section>

      <section className={css.contentCard} aria-label="Product details">
        <div className={css.tabsSection}>
          <Tabs
            items={TABS}
            activeValue={activeTab}
            ariaLabel="Product details sections"
            mobileVisibleCount={1}
            tabletVisibleCount={3}
            onChange={(tab) =>
              router.push(getAllProductDetailTabPath(productId, tab), {
                scroll: false,
              })
            }
          />

          <CatalogTabHeading tab={activeTab} />
          {isLoading || error || !product ? (
            <ProfileResourceState
              variant={error ? 'error' : 'loading'}
              title={error?.title ?? 'Loading product details'}
              description={
                error?.message ??
                'The Admin product information is being loaded.'
              }
              retryLabel="Try again"
              sideActionOnDesktop
              onRetry={() => setRetry((value) => value + 1)}
            />
          ) : activeTab === 'details' ? (
            <div className={css.detailsTab}>
              <section className={css.detailsGrid} aria-label="Product summary">
                <div className={css.visualCard}>
                  {getProductImageSrc(product.imageUrl) ? (
                    <span className={css.imageFrame}>
                      <ShimmerImage
                        className={css.image}
                        src={getProductImageSrc(product.imageUrl)!}
                        alt={product.name}
                        sizes="(min-width: 1440px) 420px, 90vw"
                        unoptimized
                      />
                    </span>
                  ) : (
                    <div className={css.imagePlaceholder} aria-hidden="true">
                      {product.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className={css.card}>
                  {isAdded ? (
                    <div className={css.addedProductNotice}>
                      <p className={css.addedProductText}>
                        This product has already been added to your pharmacies.
                      </p>
                      <LinkButton
                        href={getPharmacyProductPath(product.id)}
                        className={css.ownProductLink}
                        size="sm"
                        iconRight={<ArrowRight size={16} aria-hidden="true" />}
                      >
                        Open own product
                      </LinkButton>
                    </div>
                  ) : (
                    <p className={css.productNotice}>
                      This product has not been selected for your pharmacies yet
                    </p>
                  )}
                  <dl className={css.adminMetadata}>
                    <div className={css.adminMetadataItem}>
                      <dt>Status</dt>
                      <dd>
                        <StatusBadge
                          {...PRODUCT_STATUS_PRESENTATION[product.status]}
                        />
                      </dd>
                    </div>
                    <div className={css.adminMetadataItem}>
                      <dt>Category</dt>
                      <dd>
                        <span className={css.productCategoryDisplay}>
                          <span className={css.productCategoryIcon}>
                            <CategoryIcon
                              name={
                                resolveOwnerCatalogCategory(
                                  product.category,
                                  categoryDirectory
                                ).icon
                              }
                              size={16}
                            />
                          </span>
                          <span>{product.category.name}</span>
                        </span>
                      </dd>
                    </div>
                    <div className={css.adminMetadataItem}>
                      <dt>Article</dt>
                      <dd>{product.article}</dd>
                    </div>
                    <div className={css.adminMetadataItem}>
                      <dt>Product ID</dt>
                      <dd>{product.id}</dd>
                    </div>
                    <div className={css.adminMetadataItem}>
                      <dt>Admin creation date</dt>
                      <dd>{formatShortDate(product.createdAt) ?? '—'}</dd>
                    </div>
                    <div className={css.adminMetadataItem}>
                      <dt>Admin last update date</dt>
                      <dd>{formatShortDate(product.updatedAt) ?? '—'}</dd>
                    </div>
                  </dl>
                  {!isAdded ? (
                    <div className={css.ownerActions}>
                      <Button
                        className={css.actionButton}
                        type="button"
                        size="sm"
                        disabled={!canAdd}
                        isLoading={isAddingProduct}
                        loadingLabel="Adding product..."
                        iconLeft={
                          product.status === 'active' ? (
                            <Plus size={17} aria-hidden="true" />
                          ) : undefined
                        }
                        onClick={() => setIsAddModalOpen(true)}
                      >
                        {product.status === 'blocked'
                          ? 'Unavailable'
                          : 'Add to pharmacies'}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </section>
            </div>
          ) : activeTab === 'characteristics' ? (
            <CatalogCharacteristics product={product} />
          ) : (
            <CatalogReviews key={product.id} productId={product.id} />
          )}
        </div>
      </section>
      <OwnerAddProductConfirmation
        isOpen={isAddModalOpen}
        productName={product?.name}
        isLoading={isAddingProduct}
        onConfirm={() => void confirmAdd()}
        onCancel={() => {
          if (!isAddingProduct) setIsAddModalOpen(false);
        }}
      />
    </main>
  );
}

export default AllProductDetailsPageContent;
export { AllProductDetailsPageContent };
