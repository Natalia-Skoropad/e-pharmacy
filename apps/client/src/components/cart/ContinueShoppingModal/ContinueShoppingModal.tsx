'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

import {
  Button,
  CloseIconButton,
  LoadingSpinner,
  SearchInput,
  ShimmerImage,
  SvgIcon,
} from '@e-pharmacy/ui/common';

import { ModalBase, ModalRoot } from '@e-pharmacy/ui/modals';

import {
  getProductCategoryOptions,
  type ProductCategoryOption,
} from '@e-pharmacy/config/products';

import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/types/products';
import { formatMoney } from '@e-pharmacy/utils/money';
import { formatStockLabel } from '@e-pharmacy/utils/numbers';
import type { Cart, Product, ProductCategory } from '@e-pharmacy/types';

import { getProducts } from '@/lib/api/browser';
import { isCartOrderLimitError } from '@/lib/cart/order-limit';
import { addCartItem } from '@/lib/cart/cart-commands';

import { CartOrderLimitModal } from '@/components/common';

import css from './ContinueShoppingModal.module.css';

//===================================================================

type ContinueShoppingModalProps = {
  pharmacyId: string;
  pharmacyName: string;
  cartItems: Cart['items'];
  onClose: () => void;
  onCartChange: (cart: Cart) => void;
};

//===================================================================

const PRODUCTS_LIMIT = 150;

//===================================================================

function getProductOfferPrice(product: Product, pharmacyId: string): number {
  const pharmacyOffer = product.offers?.find(
    (offer) => offer.pharmacyId === pharmacyId
  );

  return pharmacyOffer?.price ?? product.price;
}

//===================================================================

function ContinueShoppingModal({
  pharmacyId,
  pharmacyName,
  cartItems,
  onClose,
  onCartChange,
}: ContinueShoppingModalProps) {
  const titleId = useId();
  const searchId = useId();

  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | 'all'
  >('all');

  const [categoryOptions, setCategoryOptions] = useState<
    ProductCategoryOption[]
  >([]);
  const [availableProductsCount, setAvailableProductsCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingProductIds, setAddingProductIds] = useState<Set<string>>(
    () => new Set()
  );
  const [error, setError] = useState('');
  const [orderLimitMessage, setOrderLimitMessage] = useState('');

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
        const response = await getProducts(
          {
            pharmacyId,
            page: 1,
            perPage: PRODUCTS_LIMIT,
            inStock: true,
          },
          {
            signal: controller.signal,
          }
        );

        const nextOptions = getProductCategoryOptions(response.items);

        setCategoryOptions(nextOptions);

        if (
          selectedCategory !== 'all' &&
          !nextOptions.some((category) => category.value === selectedCategory)
        ) {
          setSelectedCategory('all');
        }
      } catch {
        if (controller.signal.aborted) return;

        setError('Could not load product categories for this pharmacy.');
      }
    }

    void fetchPharmacyCategories();

    return () => {
      controller.abort();
    };
  }, [pharmacyId, selectedCategory]);

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setError('');

        const response = await getProducts(
          {
            pharmacyId,
            page: 1,
            perPage: PRODUCTS_LIMIT,
            inStock: true,
            category: selectedCategory === 'all' ? undefined : selectedCategory,
            keyword: searchValue.trim() || undefined,
          },
          {
            signal: controller.signal,
          }
        );

        setProducts(response.items);
        setAvailableProductsCount(response.total);
      } catch {
        if (controller.signal.aborted) return;

        setError('Could not load products from this pharmacy.');
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
  }, [searchValue, selectedCategory, pharmacyId]);

  const handleAddProduct = async (productId: string) => {
    if (addingProductIds.has(productId)) return;

    setAddingProductIds((current) => {
      const next = new Set(current);
      next.add(productId);
      return next;
    });

    try {
      setError('');

      const response = await addCartItem({
        productId,
        pharmacyId,
        quantity: 1,
      });

      onCartChange(response.cart);
    } catch (error) {
      if (isCartOrderLimitError(error)) {
        setOrderLimitMessage('limit');
      } else {
        setError('Could not add this product to the order.');
      }
    } finally {
      setAddingProductIds((current) => {
        const next = new Set(current);
        next.delete(productId);
        return next;
      });
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
            onChange={setSearchValue}
          />

          <p className={css.availableCount}>
            {formatStockLabel(availableProductsCount) ?? '—'}
          </p>
        </div>

        {categoryOptions.length > 0 ? (
          <div
            className={css.categories}
            aria-label="Product categories in this pharmacy"
          >
            <button
              className={
                selectedCategory === 'all' ? css.categoryActive : css.category
              }
              type="button"
              aria-pressed={selectedCategory === 'all'}
              onClick={() => setSelectedCategory('all')}
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
                onClick={() => setSelectedCategory(category.value)}
              >
                {category.label}
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <p className={css.notice} role="alert">
            {error}
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
                const isAdding = addingProductIds.has(product.id);
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
                      {formatMoney(getProductOfferPrice(product, pharmacyId)) ??
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
        </div>
      </ModalBase>

      {orderLimitMessage ? (
        <CartOrderLimitModal onClose={() => setOrderLimitMessage('')} />
      ) : null}
    </ModalRoot>
  );
}

export default ContinueShoppingModal;
