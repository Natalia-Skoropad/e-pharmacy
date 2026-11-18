'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

import {
  CircleAlert,
  LoaderCircle,
  RotateCcw,
  Search,
  ShoppingCart,
} from 'lucide-react';

import { Button, CloseIconButton, SvgIcon } from '@e-pharmacy/ui/primitives';
import { CategoryIcon, SearchInput } from '@e-pharmacy/ui/forms';
import { useToast } from '@e-pharmacy/ui/feedback';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { InfoTooltip, ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';

import { STOCK_CHANGED_ERROR_CODE } from '@e-pharmacy/config/cart';
import { formatMoney } from '@e-pharmacy/utils/money';

import type { Cart } from '@e-pharmacy/types/cart';
import type { ProductCategorySlug } from '@e-pharmacy/types/reference-data';

import type {
  ProductCardSummary,
  ProductFilterOptionsResponse,
} from '@e-pharmacy/types/products';

import { getProductFilters, getProducts } from '@/lib/api/browser';
import { isCartOrderLimitError } from '@/lib/cart/order-limit';
import { getRemainingCartStock } from '@/lib/cart/cart-stock';
import { APP_ERROR_MESSAGES, getUserFacingErrorMessage } from '@/lib/errors';

import { useCart } from '@/providers/CartProvider';

import { CartOrderLimitModal } from '@/components/common';

import css from './ContinueShoppingModal.module.css';

//===================================================================

type ContinueShoppingModalProps = Readonly<{
  pharmacyId: string;
  pharmacyName: string;
  cartItems: Cart['items'];
  onClose: () => void;
}>;

//===================================================================

const PRODUCTS_PER_PAGE = 24;

//===================================================================

function getProductOfferPrice(product: ProductCardSummary): number {
  return product.minPrice ?? product.price;
}

//===================================================================

function ContinueShoppingModal({
  pharmacyId,
  pharmacyName,
  cartItems,
  onClose,
}: ContinueShoppingModalProps) {
  const toast = useToast();
  const titleId = useId();
  const searchId = useId();
  const addingRef = useRef(false);
  const [searchValue, setSearchValue] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategorySlug | 'all'
  >('all');

  const [categoryOptions, setCategoryOptions] = useState<
    ProductFilterOptionsResponse['categories']
  >([]);

  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [availableProductsCount, setAvailableProductsCount] = useState(0);
  const [products, setProducts] = useState<ProductCardSummary[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedProducts, setHasLoadedProducts] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [productError, setProductError] = useState('');
  const [addError, setAddError] = useState('');
  const [retryVersion, setRetryVersion] = useState(0);
  const [orderLimitMessage, setOrderLimitMessage] = useState('');

  const { addProductToCart, pendingOfferIds } = useCart();

  const cartByProductId = useMemo(
    () =>
      new Map(
        cartItems
          .filter((item) => item.pharmacyId === pharmacyId)
          .map((item) => [item.productId, item] as const)
      ),
    [cartItems, pharmacyId]
  );

  const isPickerLoading =
    isLoadingCategories || !hasLoadedProducts || (isLoading && page === 1);

  const isLoadingMore = isLoading && page > 1;
  const categoriesReady = !isLoadingCategories && hasLoadedProducts;

  const visibleItemsCount =
    isPickerLoading || productError ? 0 : availableProductsCount;

  useEffect(() => {
    const controller = new AbortController();

    async function fetchPharmacyCategories() {
      try {
        const response = await getProductFilters(
          { pharmacyId, inStock: true },
          { signal: controller.signal }
        );

        if (controller.signal.aborted) return;

        setCategoryOptions(
          response.categories.filter((category) => category.value !== 'all')
        );

        setCategoryError('');
      } catch {
        if (controller.signal.aborted) return;

        setCategoryError(
          'Could not load product categories for this pharmacy.'
        );
      } finally {
        if (!controller.signal.aborted) setIsLoadingCategories(false);
      }
    }

    void fetchPharmacyCategories();

    return () => controller.abort();
  }, [pharmacyId]);

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await getProducts(
          {
            pharmacyId,
            page,
            perPage: PRODUCTS_PER_PAGE,
            inStock: true,
            category: selectedCategory === 'all' ? undefined : selectedCategory,
            keyword: searchValue.trim() || undefined,
          },
          { signal: controller.signal }
        );

        if (controller.signal.aborted) return;

        setProducts((current) =>
          page === 1 ? [...response.items] : [...current, ...response.items]
        );

        setAvailableProductsCount(response.total);
        setProductError('');
      } catch {
        if (controller.signal.aborted) return;

        setProductError('Could not load products from this pharmacy.');

        if (page === 1) {
          setProducts([]);
          setAvailableProductsCount(0);
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
  }, [searchValue, selectedCategory, pharmacyId, page, retryVersion]);

  const selectCategory = (value: ProductCategorySlug | 'all') => {
    if (selectedCategory === value) return;

    setIsLoading(true);
    setSelectedCategory(value);
    setPage(1);
  };

  const updateSearch = (value: string) => {
    setIsLoading(true);
    setSearchValue(value);
    setPage(1);
  };

  const handleAddProduct = async (productId: string) => {
    const operationKey = `${pharmacyId}:${productId}`;

    if (addingRef.current || pendingOfferIds.has(operationKey)) return;

    addingRef.current = true;

    try {
      setAddError('');

      const response = await addProductToCart(
        { productId, pharmacyId, quantity: 1 },
        { offerId: operationKey }
      );

      if (response) toast.success('Product was added to the order.');
    } catch (error) {
      if (isCartOrderLimitError(error)) {
        setOrderLimitMessage('limit');
      } else {
        setAddError(
          getUserFacingErrorMessage(error, {
            fallback: 'Could not add this product to the order.',
            backendCodeMessages: {
              [STOCK_CHANGED_ERROR_CODE]: APP_ERROR_MESSAGES.cart.stockChanged,
            },
          })
        );
      }
    } finally {
      addingRef.current = false;
    }
  };

  return (
    <ModalRoot>
      <ModalBase
        className={css.backdrop}
        dialogClassName={css.dialog}
        labelledBy={titleId}
        onClose={onClose}
      >
        <div className={css.head}>
          <div>
            <p className={css.kicker}>{pharmacyName}</p>
            <h2 className={css.title} id={titleId}>
              Continue shopping
            </h2>
          </div>
          <CloseIconButton className={css.closeButton} onClick={onClose} />
        </div>

        <div className={css.searchBlock}>
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
          className={css.categories}
          aria-label="Product categories in this pharmacy"
          aria-busy={!categoriesReady}
        >
          {categoriesReady ? (
            <>
              <button
                type="button"
                className={
                  selectedCategory === 'all' ? css.categoryActive : css.category
                }
                aria-pressed={selectedCategory === 'all'}
                onClick={() => selectCategory('all')}
              >
                <ShoppingCart size={16} aria-hidden="true" /> All
              </button>
              {categoryOptions.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  className={
                    selectedCategory === category.value
                      ? css.categoryActive
                      : css.category
                  }
                  aria-pressed={selectedCategory === category.value}
                  onClick={() => selectCategory(category.value)}
                >
                  <CategoryIcon name={category.icon} size={16} />
                  {category.label}
                </button>
              ))}
            </>
          ) : (
            <div className={css.categorySkeletons} aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <span className={css.categorySkeleton} key={index} />
              ))}
            </div>
          )}
        </div>

        <p className={css.availableCount} aria-live="polite">
          {visibleItemsCount.toLocaleString('en-US')} items available
        </p>

        {categoryError ? (
          <p className={css.categoryNotice} role="alert">
            <CircleAlert size={17} aria-hidden="true" /> {categoryError}
          </p>
        ) : null}
        {productError && !isPickerLoading ? (
          <div className={css.notice} role="alert">
            <CircleAlert size={18} aria-hidden="true" />
            <span>{productError}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsLoading(true);
                setRetryVersion((current) => current + 1);
              }}
            >
              <RotateCcw size={16} aria-hidden="true" /> Retry
            </Button>
          </div>
        ) : null}
        {addError ? (
          <p className={css.categoryNotice} role="alert">
            {addError}
          </p>
        ) : null}

        <div className={css.results}>
          {isPickerLoading ? (
            <ProfileResourceState
              variant="loading"
              title="Loading pharmacy products"
              description="Available products are being loaded for this pharmacy."
            />
          ) : null}
          {!isPickerLoading && !productError && products.length === 0 ? (
            <div className={css.empty}>
              <span className={css.emptyIcon} aria-hidden="true">
                <ShoppingCart size={24} />
              </span>
              <div>
                <h3>No matching products in this pharmacy.</h3>
                <p>Try another product search or category.</p>
              </div>
            </div>
          ) : null}
          {!isPickerLoading && products.length > 0 ? (
            <ul className={css.productList}>
              {products.map((product) => {
                const inCartItem = cartByProductId.get(product.id);
                const isInCart = Boolean(inCartItem);

                const isAdding = pendingOfferIds.has(
                  `${pharmacyId}:${product.id}`
                );

                const currentStock =
                  product.availableQuantity ?? inCartItem?.stockQuantity;

                const availableQuantity =
                  currentStock === undefined
                    ? null
                    : getRemainingCartStock(
                        currentStock,
                        inCartItem?.quantity ?? 0
                      );

                return (
                  <li className={css.productItem} key={product.id}>
                    <div className={css.productImageWrap}>
                      {product.imageUrl ? (
                        <ShimmerImage
                          className={css.productImage}
                          src={product.imageUrl}
                          alt={product.name}
                          sizes="72px"
                        />
                      ) : (
                        <div
                          className={css.productImageFallback}
                          aria-hidden="true"
                        >
                          <SvgIcon name="icon-shopping-cart" size={24} />
                        </div>
                      )}
                    </div>
                    <div className={css.productInfo}>
                      <h3 className={css.productName}>{product.name}</h3>
                      <p className={css.productMeta}>
                        <CategoryIcon name={product.category.icon} size={16} />
                        {product.category.name}
                      </p>
                      {availableQuantity !== null ? (
                        <p className={css.productAvailability}>
                          {availableQuantity} items available
                        </p>
                      ) : null}
                    </div>
                    <div className={css.productActions}>
                      <p className={css.productPrice}>
                        {formatMoney(getProductOfferPrice(product)) ?? '—'}
                      </p>
                      <Button
                        className={isInCart ? css.inCartButton : css.addButton}
                        type="button"
                        size="sm"
                        variant={isInCart ? 'secondary' : 'primary'}
                        disabled={isInCart || pendingOfferIds.size > 0}
                        onClick={() => void handleAddProduct(product.id)}
                      >
                        {isInCart ? (
                          'In cart'
                        ) : isAdding ? (
                          <>
                            <LoaderCircle
                              className={css.addSpinner}
                              size={17}
                              aria-hidden="true"
                            />{' '}
                            Adding...
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={18} aria-hidden="true" /> Add
                          </>
                        )}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {!isPickerLoading &&
          !productError &&
          products.length < availableProductsCount ? (
            <Button
              type="button"
              variant="secondary"
              disabled={isLoadingMore}
              onClick={() => {
                setIsLoading(true);
                setPage((current) => current + 1);
              }}
            >
              {isLoadingMore ? (
                <LoaderCircle
                  className={css.addSpinner}
                  size={17}
                  aria-hidden="true"
                />
              ) : null}
              {isLoadingMore ? 'Loading...' : 'Load more'}
            </Button>
          ) : null}
        </div>
      </ModalBase>
      {orderLimitMessage ? (
        <CartOrderLimitModal onClose={() => setOrderLimitMessage('')} />
      ) : null}
    </ModalRoot>
  );
}

export default ContinueShoppingModal;
