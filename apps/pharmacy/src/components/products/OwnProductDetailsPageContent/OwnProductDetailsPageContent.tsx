'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  BarChart3,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  History,
  MessageSquareText,
  UsersRound,
} from 'lucide-react';

import type { ProductDetails, ProductOffer } from '@e-pharmacy/types/products';
import type { ProductCategoryReference } from '@e-pharmacy/types/reference-data';

import { PRODUCT_MANAGEMENT_ERROR_CODES } from '@e-pharmacy/config/products';

import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { Tabs, type TabItem } from '@e-pharmacy/ui/navigation';
import { RatingSummary } from '@e-pharmacy/ui/data-display';
import { PageHeader } from '@e-pharmacy/ui/layout';
import { ConfirmationModal } from '@e-pharmacy/ui/overlays';
import { useToast } from '@e-pharmacy/ui/feedback';

import { isApiError } from '@e-pharmacy/api-client/transport';

import { getProductCategories } from '@/lib/api/browser';
import { removeProductFromMyPharmacy } from '@/lib/api/browser';
import { getOwnerCatalogProductDetails } from '@/lib/api/browser/owner-all-products.api';
import { getSafeApiErrorMessage } from '@/lib/errors/get-safe-api-error-message';
import { dispatchPharmacyBreadcrumbLabel } from '@/lib/layout/breadcrumbs';
import { getLockedFeatureBannerStatus } from '@/lib/pharmacies/current-pharmacy-status';

import { usePharmacyProfile } from '@/providers/PharmacyProfileProvider';

import {
  getOwnProductDetailTabPath,
  parseOwnProductDetailTabPath,
  type OwnProductDetailTab,
} from '@/lib/products/own-product-detail-tabs';

import { OwnProductTabHeading } from './OwnProductTabHeading';
import { OwnProductDetailsTab } from './OwnProductDetailsTab';
import { OwnProductStatisticsTab } from './OwnProductStatisticsTab';
import { OwnProductRelatedOrdersTab } from './OwnProductRelatedOrdersTab';
import { OwnProductStockMovementTab } from './OwnProductStockMovementTab';
import { OwnProductClientsTab } from './OwnProductClientsTab';
import { OwnProductPharmaciesTab } from './OwnProductPharmaciesTab';
import { OwnProductCommentsTab } from './OwnProductCommentsTab';

import css from './OwnProductDetailsPageContent.module.css';

//===================================================================

const PRODUCT_DETAILS_TABS: Array<TabItem<OwnProductDetailTab>> = [
  { value: 'details', label: 'Details', icon: <Boxes size={17} /> },
  {
    value: 'statistics',
    label: 'Statistics',
    icon: <ChartNoAxesCombined size={17} />,
  },
  {
    value: 'related-orders',
    label: 'Related orders',
    icon: <BarChart3 size={17} />,
  },
  {
    value: 'stock-movement',
    label: 'Stock movement',
    icon: <History size={17} />,
  },
  { value: 'clients', label: 'Clients', icon: <UsersRound size={17} /> },
  { value: 'pharmacies', label: 'Pharmacies', icon: <Building2 size={17} /> },
  {
    value: 'comments',
    label: 'Comments',
    icon: <MessageSquareText size={17} />,
  },
];

//===================================================================

function getProductError(error: unknown) {
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

function shouldReconcileRemove(error: unknown) {
  return (
    isApiError(error) &&
    (error.transportCode === 'NETWORK_ERROR' ||
      error.transportCode === 'TIMEOUT' ||
      error.transportCode === 'INVALID_RESPONSE' ||
      (error.httpStatus ?? 0) >= 500 ||
      error.httpStatus === 404 ||
      error.httpStatus === 409)
  );
}

//===================================================================

function getProductOffer(
  product: ProductDetails,
  pharmacyId: string | null
): ProductOffer | null {
  return pharmacyId
    ? (product.offers.find(
        (offer) => String(offer.pharmacyId) === String(pharmacyId)
      ) ?? null)
    : null;
}

//===================================================================

function OwnProductDetailsPageContent({
  productId,
}: Readonly<{ productId: string }>) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { profile: pharmacyProfile } = usePharmacyProfile();
  const currentPharmacyId = pharmacyProfile?.id ?? null;

  const activeTab =
    parseOwnProductDetailTabPath(pathname, productId) ?? 'details';

  const [product, setProduct] = useState<ProductDetails | null>(null);

  const [categoryDirectory, setCategoryDirectory] = useState<
    readonly ProductCategoryReference[]
  >([]);

  const [commentsTotal, setCommentsTotal] = useState<number | null>(null);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<ReturnType<typeof getProductError> | null>(
    null
  );

  const [retry, setRetry] = useState(0);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isRemovingProduct, setIsRemovingProduct] = useState(false);

  const selectedOffer = product
    ? getProductOffer(product, currentPharmacyId)
    : null;

  const canRemove = Boolean(
    product &&
    selectedOffer &&
    currentPharmacyId &&
    !getLockedFeatureBannerStatus(pharmacyProfile?.status ?? null) &&
    !selectedOffer.hasRelatedOrders
  );

  useEffect(() => {
    const controller = new AbortController();

    void getProductCategories({ signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) setCategoryDirectory(items);
      })
      .catch(() => {
        /* Preserve the product's category when directory is unavailable. */
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setIsLoading(true);
        setError(null);
        setProduct(null);
      }
    });

    void getOwnerCatalogProductDetails(productId, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;

        if (!response.product.isAddedToOwner) {
          setError({
            title: 'Product not found in own products',
            message: 'This product has not been added to your pharmacies.',
          });
        } else setProduct(response.product);
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) setError(getProductError(loadError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [productId, retry]);

  useEffect(() => {
    if (product?.name) dispatchPharmacyBreadcrumbLabel(product.name);
  }, [product?.name, pathname]);

  async function confirmRemove() {
    if (!product || !canRemove) return;

    setIsRemovingProduct(true);

    const offersAfterRemoval = product.offers.filter(
      (offer) => String(offer.pharmacyId) !== String(currentPharmacyId)
    );

    try {
      const response = await removeProductFromMyPharmacy(product.id);

      const refreshed = await getOwnerCatalogProductDetails(product.id).catch(
        () => null
      );

      setProduct(
        refreshed?.product ?? {
          ...product,
          offers: offersAfterRemoval,
          isAddedToOwner: offersAfterRemoval.length > 0,
        }
      );

      setCommentsTotal(0);
      setIsRemoveModalOpen(false);

      toast.success(
        response.message || 'Product was removed from your pharmacy.'
      );
    } catch (removeError) {
      if (currentPharmacyId && shouldReconcileRemove(removeError)) {
        try {
          const latest = await getOwnerCatalogProductDetails(product.id);

          if (!getProductOffer(latest.product, currentPharmacyId)) {
            setProduct(latest.product);
            setCommentsTotal(0);
            setIsRemoveModalOpen(false);
            toast.success('Product is already removed from your pharmacy.');

            return;
          }
        } catch {
          /* Best-effort reconciliation. */
        }
      }

      const message = getSafeApiErrorMessage(
        removeError,
        'Product action could not be completed. Please try again.',
        {
          backendMessages: {
            [PRODUCT_MANAGEMENT_ERROR_CODES.PHARMACY_NOT_FOUND]:
              'Pharmacy profile is unavailable for this account.',

            [PRODUCT_MANAGEMENT_ERROR_CODES.PHARMACY_LOCKED]:
              'Product management is unavailable until Admin verifies the pharmacy.',

            [PRODUCT_MANAGEMENT_ERROR_CODES.NOT_ADDED]:
              'This product is no longer added to your pharmacy.',

            [PRODUCT_MANAGEMENT_ERROR_CODES.HAS_RELATED_ORDERS]:
              'This product cannot be removed because it has related orders.',
          },
        }
      );
      if (message) toast.error(message);
    } finally {
      setIsRemovingProduct(false);
    }
  }

  const tabs = PRODUCT_DETAILS_TABS.map((tab) =>
    tab.value === 'comments' && commentsTotal !== null
      ? { ...tab, label: `Comments (${commentsTotal})` }
      : tab
  );

  return (
    <main className={css.page} aria-labelledby="own-product-page-title">
      <section className={css.contentCard}>
        <div className={css.stack}>
          <div className={css.titleBlock}>
            <PageHeader
              title={product?.name ?? error?.title ?? 'Own product'}
              titleId="own-product-page-title"
              icon={<Boxes size={23} aria-hidden="true" />}
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
            items={tabs}
            activeValue={activeTab}
            ariaLabel="Product details sections"
            mobileVisibleCount={1}
            tabletVisibleCount={3}
            onChange={(tab) =>
              router.push(getOwnProductDetailTabPath(productId, tab), {
                scroll: false,
              })
            }
          />
          <OwnProductTabHeading tab={activeTab} />
          {activeTab === 'statistics' ? (
            <OwnProductStatisticsTab productId={productId} />
          ) : activeTab === 'stock-movement' ? (
            <OwnProductStockMovementTab
              productId={productId}
              product={product}
              pharmacyId={selectedPharmacyId}
              onPharmacyChange={setSelectedPharmacyId}
              productLoading={isLoading}
              productError={error?.message ?? null}
              onRetryProduct={() => setRetry((value) => value + 1)}
            />
          ) : isLoading || error || !product ? (
            <ProfileResourceState
              variant={error ? 'error' : 'loading'}
              title={error?.title ?? 'Loading own product details'}
              description={
                error?.message ??
                'Your product details and pharmacy information are being loaded.'
              }
              retryLabel="Try again"
              sideActionOnDesktop
              onRetry={() => setRetry((value) => value + 1)}
            />
          ) : activeTab === 'details' ? (
            <OwnProductDetailsTab
              product={product}
              currentOffer={selectedOffer}
              pharmacyStatus={pharmacyProfile?.status ?? null}
              categories={categoryDirectory}
              canRemove={canRemove}
              removing={isRemovingProduct}
              onRemove={() => setIsRemoveModalOpen(true)}
            />
          ) : activeTab === 'related-orders' ? (
            <OwnProductRelatedOrdersTab
              key={product.id}
              productId={product.id}
            />
          ) : activeTab === 'clients' ? (
            <OwnProductClientsTab key={product.id} productId={product.id} />
          ) : activeTab === 'pharmacies' ? (
            <OwnProductPharmaciesTab product={product} />
          ) : (
            <OwnProductCommentsTab
              key={product.id}
              productId={product.id}
              enabled={Boolean(selectedOffer)}
              onTotalChange={setCommentsTotal}
            />
          )}
        </div>
      </section>

      <ConfirmationModal
        isOpen={isRemoveModalOpen}
        title="Remove product from pharmacy?"
        description="This product will be removed from your own products only if no orders were created for it."
        confirmLabel="Remove product"
        isLoading={isRemovingProduct}
        onConfirm={() => void confirmRemove()}
        onCancel={() => {
          if (!isRemovingProduct) setIsRemoveModalOpen(false);
        }}
      />
    </main>
  );
}

export default OwnProductDetailsPageContent;
export { OwnProductDetailsPageContent };
