'use client';

import { useEffect, useId, useMemo, useState } from 'react';

import { ShoppingCart } from 'lucide-react';

import {
  Button,
  CloseIconButton,
  LoadingSpinner,
  SvgIcon,
} from '@e-pharmacy/ui/primitives';

import { SearchInput } from '@e-pharmacy/ui/forms';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';

import { STOCK_CHANGED_ERROR_CODE } from '@e-pharmacy/config/cart';
import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/presentation';

import { formatMoney } from '@e-pharmacy/utils/money';
import { formatStockLabel } from '@e-pharmacy/utils/numbers';
import type { Cart } from '@e-pharmacy/types/cart';

import type {
  ProductCardSummary,
  ProductCategory,
  ProductFilterOptionsResponse,
} from '@e-pharmacy/types/products';

import { getProductFilters, getProducts } from '@/lib/api/browser';
import { isCartOrderLimitError } from '@/lib/cart/order-limit';
import { APP_ERROR_MESSAGES, getUserFacingErrorMessage } from '@/lib/errors';
import { useCart } from '@/providers/CartProvider';

import { CartOrderLimitModal } from '@/components/common';

import css from './ContinueShoppingModal.module.css';

//===================================================================

type ContinueShoppingModalProps = {
  pharmacyId: string;
  pharmacyName: string;
  cartItems: Cart['items'];
  onClose: () => void;
};

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
  const titleId = useId();
  const searchId = useId();

  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | 'all'
  >('all');

  const [categoryOptions, setCategoryOptions] = useState<
    ProductFilterOptionsResponse['categories']
  >([]);
  const [availableProductsCount, setAvailableProductsCount] = useState(0);
  const [products, setProducts] = useState<ProductCardSummary[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [productError, setProductError] = useState('');
  const [addError, setAddError] = useState('');
  const [orderLimitMessage, setOrderLimitMessage] = useState('');

  const { addProductToCart, pendingOfferIds } = useCart();

  const cartProductIds = useMemo(() => {
    return new Set(
      cartItems
        .filter((item) => item.pharmacyId === pharmacyId)
        .map((item) => item.productId)
    );
  }, [cartItems, pharmacyId]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchPharmacyCategories() {
      try {
        setCategoryError('');

        const response = await getProductFilters(
          { pharmacyId, inStock: true },
          { signal: controller.signal }
        );

        const nextOptions = response.categories.filter(
          (category) => category.value !== 'all'
        );
        setCategoryOptions(nextOptions);

        setSelectedCategory((current) => {
          if (
            current !== 'all' &&
            !nextOptions.some((category) => category.value === current)
          ) {
            return 'all';
          }

          return current;
        });
      } catch {
        if (controller.signal.aborted) return;
        setCategoryError('Could not load product categories for this pharmacy.');
      }
    }

    void fetchPharmacyCategories();

    return () => {
      controller.abort();
    };
  }, [pharmacyId]);

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setProductError('');

        const response = await getProducts(
          {
            pharmacyId,
            page,
            perPage: PRODUCTS_PER_PAGE,
            inStock: true,
            category: selectedCategory === 'all' ? undefined : selectedCategory,
            keyword: searchValue.trim() || undefined,
          },
          {
            signal: controller.signal,
          }
        );

        setProducts((current) =>
          page === 1 ? [...response.items] : [...current, ...response.items]
        );
        setAvailableProductsCount(response.total);
      } catch {
        if (controller.signal.aborted) return;

        setProductError('Could not load products from this pharmacy.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchValue, selectedCategory, pharmacyId, page]);

  const handleAddProduct = async (productId: string) => {
    const operationKey = `${pharmacyId}:${productId}`;
    if (pendingOfferIds.has(operationKey)) return;

    try {
      setAddError('');

      await addProductToCart(
        {
          productId,
          pharmacyId,
          quantity: 1,
        },
        { offerId: operationKey }
      );
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
            label="Search products"
            value={searchValue}
            placeholder="Add one more product"
            isActive={Boolean(searchValue)}
            onChange={(value) => {
              setSearchValue(value);
              setPage(1);
            }}
          />

          <p className={css.availableCount}>
            {formatStockLabel(availableProductsCount) ?? '—'}
          </p>
        </div>

        {categoryOptions.length > 0 ? (
          <div
            className={css.categories}
            aria-label="ProductDetails categories in this pharmacy"
          >
            <button
              className={
                selectedCategory === 'all' ? css.categoryActive : css.category
              }
              type="button"
              aria-pressed={selectedCategory === 'all'}
              onClick={() => {
                setSelectedCategory('all');
                setPage(1);
              }}
            >
              All
            </button>

            {categoryOptions.map((category) => (
              <button
                className={
                  selectedCategory === category.value
                    ? css.categoryActive
                    : css.category
                }
                type="button"
                key={category.value}
                aria-pressed={selectedCategory === category.value}
                onClick={() => {
                  setSelectedCategory(category.value);
                  setPage(1);
                }}
              >
                {category.label}
              </button>
            ))}
          </div>
        ) : null}

        {categoryError ? (
          <p className={css.notice} role="alert">
            {categoryError}
          </p>
        ) : null}

        {productError ? (
          <p className={css.notice} role="alert">
            {productError}
          </p>
        ) : null}

        {addError ? (
          <p className={css.notice} role="alert">
            {addError}
          </p>
        ) : null}

        <div className={css.results}>
          {isLoading ? (
            <LoadingSpinner label="Loading pharmacy products..." />
          ) : null}

          {!isLoading && products.length === 0 ? (
            <p className={css.status}>No matching products in this pharmacy.</p>
          ) : null}

          {!isLoading && products.length > 0 ? (
            <ul className={css.productList}>
              {products.map((product) => {
                const isInCart = cartProductIds.has(product.id);
                const isAdding = pendingOfferIds.has(
                  `${pharmacyId}:${product.id}`
                );
                const categoryLabel =
                  PRODUCT_CATEGORY_LABELS[product.category] ?? product.category;

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

                      <p className={css.productMeta}>{categoryLabel}</p>

                      {product.manufacturer ? (
                        <p className={css.productManufacturer}>
                          {product.manufacturer}
                        </p>
                      ) : null}
                    </div>

                    <p className={css.productPrice}>
                      {formatMoney(getProductOfferPrice(product)) ??
                        '—'}
                    </p>

                    <Button
                      className={isInCart ? css.inCartButton : css.addButton}
                      type="button"
                      size="sm"
                      variant={isInCart ? 'secondary' : 'primary'}
                      disabled={isInCart || isAdding}
                      onClick={() => void handleAddProduct(product.id)}
                    >
                      {isInCart ? (
                        'In cart'
                      ) : isAdding ? (
                        'Adding...'
                      ) : (
                        <>
                          <ShoppingCart size={18} aria-hidden="true" />
                          Add
                        </>
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {!isLoading && products.length < availableProductsCount ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPage((current) => current + 1)}
            >
              Load more
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
