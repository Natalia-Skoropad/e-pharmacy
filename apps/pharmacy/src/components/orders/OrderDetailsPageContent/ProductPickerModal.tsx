'use client';

import { useEffect, useId, useRef, useState } from 'react';

import {
  CircleAlert,
  LoaderCircle,
  RotateCcw,
  Search,
  ShoppingCart,
} from 'lucide-react';

import { Button, CloseIconButton, SvgIcon } from '@e-pharmacy/ui/primitives';
import { CategoryIcon, SearchInput } from '@e-pharmacy/ui/forms';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { InfoTooltip, ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';

import type { ProductDetails } from '@e-pharmacy/types/products';
import type { ProductCategorySlug } from '@e-pharmacy/types/reference-data';

import type { LabeledOption } from '@e-pharmacy/utils/collections';
import { formatMoney } from '@e-pharmacy/utils/money';

import { getProductFilters } from '@/lib/api/browser';
import { getOrderPickerProducts } from '@/lib/api/browser/products.api';
import { getProductCategories } from '@/lib/api/browser/product-categories.api';
import type { PharmacyOrderDetails } from '@/lib/orders/orders';
import { getProductImageSrc } from '@/lib/products/product-images';

import css from './OrderDetailsPageContent.module.css';

//===================================================================

const PRODUCT_PICKER_LIMIT = 150;

//===================================================================

function getProductOffer(product: ProductDetails, pharmacyId: string) {
  return product.offers.find((offer) => offer.pharmacyId === pharmacyId);
}

//===================================================================

function ProductPickerModal({
  order,
  onClose,
  onAddProduct,
}: Readonly<{
  order: PharmacyOrderDetails;
  onClose: () => void;
  onAddProduct: (product: ProductDetails) => Promise<void>;
}>) {
  const titleId = useId();
  const searchId = useId();
  const [searchValue, setSearchValue] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategorySlug | 'all'
  >('all');

  const [categoryOptions, setCategoryOptions] = useState<
    readonly (LabeledOption<ProductCategorySlug> & { icon?: string })[]
  >([]);

  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>(
    {}
  );

  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [availableProductsCount, setAvailableProductsCount] = useState(0);
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedProducts, setHasLoadedProducts] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [retryVersion, setRetryVersion] = useState(0);

  const [addingProductIds, setAddingProductIds] = useState<Set<string>>(
    () => new Set()
  );

  const isAddPendingRef = useRef(false);

  // Keep one continuous loading state until both the category filters and
  // the initial product list are ready, rather than flashing two loading phases.
  const isPickerLoading =
    isLoading || isLoadingCategories || !hasLoadedProducts;

  const visibleItemsCount =
    isPickerLoading || productsError ? 0 : availableProductsCount;

  const categoriesReady = !isLoadingCategories && hasLoadedProducts;

  const selectCategory = (category: ProductCategorySlug | 'all') => {
    if (category === selectedCategory) return;

    setIsLoading(true);
    setSelectedCategory(category);
  };

  const updateSearch = (value: string) => {
    setIsLoading(true);
    setSearchValue(value);
  };

  const retryProducts = () => {
    setIsLoading(true);
    setRetryVersion((current) => current + 1);
  };

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const [response, directory] = await Promise.all([
          getProductFilters(
            { pharmacyId: order.pharmacyId, inStock: true },
            { signal: controller.signal }
          ),

          getProductCategories({ signal: controller.signal }).catch(() => []),
        ]);

        const iconBySlug = Object.fromEntries(
          directory.map((category) => [category.slug, category.icon ?? ''])
        );

        if (controller.signal.aborted) return;

        setCategoryIcons(iconBySlug);

        setCategoryOptions(
          response.categories.flatMap((option) =>
            option.value === 'all'
              ? []
              : [
                  {
                    value: option.value,
                    label: option.label,
                    icon: iconBySlug[option.value] ?? option.icon,
                  },
                ]
          )
        );
      } catch {
        // Category filters are optional. Product search remains available
        // even if their separate request fails.
        if (!controller.signal.aborted) setCategoryOptions([]);
      } finally {
        if (!controller.signal.aborted) setIsLoadingCategories(false);
      }
    }

    void loadCategories();

    return () => controller.abort();
  }, [order.pharmacyId]);

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setProductsError('');

        const response = await getOrderPickerProducts(
          {
            pharmacyId: order.pharmacyId,
            inStock: true,
            page: 1,
            perPage: PRODUCT_PICKER_LIMIT,
            category: selectedCategory === 'all' ? undefined : selectedCategory,
            keyword: searchValue.trim() || undefined,
          },
          { signal: controller.signal }
        );

        if (!controller.signal.aborted) {
          setProducts([...response.items]);
          setAvailableProductsCount(response.total);
        }
      } catch {
        if (!controller.signal.aborted) {
          setProducts([]);
          setAvailableProductsCount(0);
          setProductsError('Could not load products from this pharmacy.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setHasLoadedProducts(true);
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [order.pharmacyId, searchValue, selectedCategory, retryVersion]);

  const handleAddProduct = async (product: ProductDetails) => {
    if (isAddPendingRef.current) return;

    isAddPendingRef.current = true;

    setAddingProductIds((current) => {
      const next = new Set(current);

      next.add(product.id);

      return next;
    });

    try {
      await onAddProduct(product);
    } finally {
      isAddPendingRef.current = false;

      setAddingProductIds((current) => {
        const next = new Set(current);

        next.delete(product.id);

        return next;
      });
    }
  };

  return (
    <ModalRoot>
      <ModalBase
        className={css.productModalBackdrop}
        dialogClassName={css.productModal}
        labelledBy={titleId}
        onClose={onClose}
      >
        <div className={css.productModalHead}>
          <div>
            <p className={css.productModalKicker}>{order.pharmacyName}</p>
            <h2 className={css.productModalTitle} id={titleId}>
              Continue shopping
            </h2>
          </div>

          <CloseIconButton
            className={css.productModalCloseButton}
            onClick={onClose}
          />
        </div>

        <div className={css.productModalSearchBlock}>
          <SearchInput
            id={searchId}
            label="Product search"
            labelAccessory={
              <InfoTooltip
                label="Product search help"
                escapeOverflow
                preferTopLayer
                title="Product search"
                icon={<ShoppingCart size={20} aria-hidden="true" />}
                items={[
                  {
                    title: 'Search fields',
                    description:
                      'Find a product by its name, article or ID. Suggestions are limited to available products in this pharmacy.',
                    icon: <Search size={17} aria-hidden="true" />,
                  },
                ]}
              />
            }
            value={searchValue}
            placeholder="Name, article, or product ID"
            isActive={Boolean(searchValue)}
            onChange={updateSearch}
          />
        </div>

        <div
          className={css.productModalCategories}
          aria-label="Product categories in this pharmacy"
          aria-busy={!categoriesReady}
        >
          {categoriesReady ? (
            <>
              <button
                className={
                  selectedCategory === 'all'
                    ? css.productModalCategoryActive
                    : css.productModalCategory
                }
                type="button"
                aria-pressed={selectedCategory === 'all'}
                onClick={() => selectCategory('all')}
              >
                <ShoppingCart size={16} aria-hidden="true" />
                All
              </button>

              {categoryOptions.map((category) => (
                <button
                  className={
                    selectedCategory === category.value
                      ? css.productModalCategoryActive
                      : css.productModalCategory
                  }
                  type="button"
                  key={category.value}
                  aria-pressed={selectedCategory === category.value}
                  onClick={() => selectCategory(category.value)}
                >
                  <CategoryIcon name={category.icon} size={16} />
                  {category.label}
                </button>
              ))}
            </>
          ) : (
            <div
              className={css.productModalCategorySkeletons}
              aria-hidden="true"
            >
              {Array.from({ length: 4 }, (_, index) => (
                <span
                  className={css.productModalCategorySkeleton}
                  key={index}
                />
              ))}
            </div>
          )}
        </div>

        <p className={css.productModalAvailableCount} aria-live="polite">
          {`${visibleItemsCount.toLocaleString('en-US')} items available`}
        </p>

        {productsError && !isPickerLoading ? (
          <div className={css.productModalNotice} role="alert">
            <CircleAlert size={18} aria-hidden="true" />
            <span>{productsError}</span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={retryProducts}
            >
              <RotateCcw size={15} aria-hidden="true" />
              Retry
            </Button>
          </div>
        ) : null}

        <div className={css.productModalResults}>
          {isPickerLoading ? (
            <ProfileResourceState
              variant="loading"
              title="Loading pharmacy products"
              description="Available products are being loaded for this pharmacy."
            />
          ) : null}

          {!isPickerLoading && !productsError && products.length === 0 ? (
            <div className={css.productModalEmpty}>
              <span className={css.emptyProductsIcon} aria-hidden="true">
                <ShoppingCart size={24} />
              </span>
              <div>
                <h3>No matching products in this pharmacy.</h3>
                <p>Try another product search or category.</p>
              </div>
            </div>
          ) : null}

          {!isPickerLoading && !productsError && products.length > 0 ? (
            <ul className={css.productModalList}>
              {products.map((product) => {
                const offer = getProductOffer(product, order.pharmacyId);

                const orderItem = offer
                  ? order.items.find((item) => item.productOfferId === offer.id)
                  : undefined;

                const isInOrder = Boolean(orderItem);

                // A saved order has already reserved stock. Its latest server
                // snapshot is more recent than the catalogue search response
                // after a quantity update; never subtract reserved units twice.
                const availableQuantity = Math.max(
                  0,
                  order.id !== 'draft' &&
                    orderItem?.availableQuantity !== undefined
                    ? orderItem.availableQuantity
                    : (offer?.availableQuantity ?? 0) -
                        (order.id === 'draft' ? (orderItem?.quantity ?? 0) : 0)
                );

                const isAdding = addingProductIds.has(product.id);
                const categoryLabel = product.category.name;
                const imageSrc = getProductImageSrc(product.imageUrl);

                return (
                  <li className={css.productModalItem} key={product.id}>
                    <div className={css.productModalImageWrap}>
                      {imageSrc ? (
                        <ShimmerImage
                          className={css.productModalImage}
                          src={imageSrc}
                          alt={product.name}
                          sizes="72px"
                          unoptimized
                        />
                      ) : (
                        <div
                          className={css.productModalImageFallback}
                          aria-hidden="true"
                        >
                          <SvgIcon name="icon-shopping-cart" size={24} />
                        </div>
                      )}
                    </div>

                    <div className={css.productModalInfo}>
                      <h3 className={css.productModalName}>{product.name}</h3>
                      <p className={css.productModalMeta}>
                        <CategoryIcon
                          name={
                            categoryIcons[product.category.slug] ??
                            product.category.icon
                          }
                          size={16}
                        />
                        {categoryLabel}
                      </p>
                      <p className={css.productModalAvailability}>
                        {availableQuantity} items available
                      </p>
                    </div>

                    <div className={css.productModalActions}>
                      <p className={css.productModalPrice}>
                        {formatMoney(offer?.price ?? product.price) ?? '—'}
                      </p>

                      <Button
                        className={
                          isInOrder
                            ? css.productModalInOrderButton
                            : css.productModalAddButton
                        }
                        type="button"
                        size="sm"
                        variant={isInOrder ? 'secondary' : 'primary'}
                        disabled={
                          !offer ||
                          offer.availableQuantity < 1 ||
                          isInOrder ||
                          addingProductIds.size > 0
                        }
                        onClick={() => void handleAddProduct(product)}
                      >
                        {isInOrder ? (
                          'In order'
                        ) : isAdding ? (
                          <>
                            <LoaderCircle
                              className={css.productModalAddSpinner}
                              size={17}
                              aria-hidden="true"
                            />
                            Adding...
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={18} aria-hidden="true" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </ModalBase>
    </ModalRoot>
  );
}

export { ProductPickerModal };
