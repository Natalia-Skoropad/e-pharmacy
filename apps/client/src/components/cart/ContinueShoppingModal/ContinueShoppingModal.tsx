'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

import {
  Button,
  CloseIconButton,
  ConfirmActionModal,
  LoadingSpinner,
  SearchInput,
  ShimmerImage,
  SvgIcon,
} from '@/components/common';

import { ModalBase, ModalRoot } from '@/components/modals';
import { ApiError } from '@/lib/api';
import { addCartItem, getProducts } from '@/services';

import type { Cart, Product, ProductCategory } from '@/types';

import css from './ContinueShoppingModal.module.css';

//===================================================================

type ContinueShoppingModalProps = {
  storeId: string;
  storeName: string;
  cartItems: Cart['items'];
  authToken: string;
  onClose: () => void;
  onCartChange: (cart: Cart) => void;
};

type CategoryOption = {
  value: ProductCategory;
  label: string;
};

//===================================================================

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  medicine: 'Medicines',
  vitamins: 'Vitamins and minerals',
  beauty: 'Beauty',
  hygiene: 'Hygiene',
  'medical-devices': 'Medical devices',
  other: 'Other',
};

const PRODUCTS_LIMIT = 150;
const CATEGORY_PRODUCTS_LIMIT = 200;

//===================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 2,
  }).format(price);
}

function getStoreProductPrice(product: Product, storeId: string): number {
  const storeOffer = product.offers?.find((offer) => offer.storeId === storeId);

  return storeOffer?.price ?? product.price;
}

function getUniqueCategoryOptions(products: Product[]): CategoryOption[] {
  const categories = new Set<ProductCategory>();

  for (const product of products) {
    categories.add(product.category);
  }

  return [...categories]
    .map((category) => ({
      value: category,
      label: CATEGORY_LABELS[category] ?? category,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function formatProductsCount(total: number): string {
  return total === 1
    ? '1 available product in this pharmacy'
    : `${total} available products in this pharmacy`;
}

//===================================================================

function ContinueShoppingModal({
  storeId,
  storeName,
  cartItems,
  authToken,
  onClose,
  onCartChange,
}: ContinueShoppingModalProps) {
  const titleId = useId();
  const searchId = useId();

  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    ProductCategory | 'all'
  >('all');
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [availableProductsCount, setAvailableProductsCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingProductId, setIsAddingProductId] = useState<string | null>(
    null
  );
  const [error, setError] = useState('');
  const [invoiceLimitMessage, setInvoiceLimitMessage] = useState('');

  const categoryOptions = useMemo(
    () => getUniqueCategoryOptions(categoryProducts),
    [categoryProducts]
  );

  const cartProductIds = useMemo(() => {
    return new Set(
      cartItems
        .filter((item) => item.storeId === storeId)
        .map((item) => item.productId)
    );
  }, [cartItems, storeId]);

  useEffect(() => {
    let isMounted = true;

    async function fetchStoreCategories() {
      try {
        const response = await getProducts({
          storeId,
          page: 1,
          perPage: CATEGORY_PRODUCTS_LIMIT,
          inStock: true,
        });

        if (!isMounted) return;

        setCategoryProducts(response.items);
        setAvailableProductsCount(response.total);
      } catch {
        if (!isMounted) return;

        setError('Could not load pharmacy categories.');
      }
    }

    void fetchStoreCategories();

    return () => {
      isMounted = false;
    };
  }, [storeId]);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setError('');

        const response = await getProducts({
          storeId,
          page: 1,
          perPage: PRODUCTS_LIMIT,
          inStock: true,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          keyword: searchValue.trim() || undefined,
        });

        if (!isMounted) return;

        setProducts(response.items);
      } catch {
        if (!isMounted) return;

        setError('Could not load products from this pharmacy.');
      } finally {
        if (!isMounted) return;

        setIsLoading(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [searchValue, selectedCategory, storeId]);

  const handleAddProduct = async (productId: string) => {
    try {
      setIsAddingProductId(productId);
      setError('');

      const response = await addCartItem(
        {
          productId,
          storeId,
          quantity: 1,
        },
        authToken
      );

      onCartChange(response.cart);
    } catch (error) {
      if (error instanceof ApiError && error.message.includes('15 invoices')) {
        setInvoiceLimitMessage(
          'You cannot add more than 15 invoices to your cart. Please confirm the previous ones to continue shopping'
        );
      } else {
        setError(
          error instanceof ApiError
            ? error.message
            : 'Could not add this product to the invoice.'
        );
      }
    } finally {
      setIsAddingProductId(null);
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
            <p className={css.kicker}>{storeName}</p>
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
            {formatProductsCount(availableProductsCount)}
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
                const isAdding = isAddingProductId === product.id;
                const categoryLabel =
                  CATEGORY_LABELS[product.category] ?? product.category;

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
                      {formatPrice(getStoreProductPrice(product, storeId))}
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

      {invoiceLimitMessage ? (
        <ConfirmActionModal
          title="Cart invoice limit"
          text={invoiceLimitMessage}
          confirmLabel="Got it"
          cancelLabel="Close"
          onConfirm={() => setInvoiceLimitMessage('')}
          onCancel={() => setInvoiceLimitMessage('')}
        />
      ) : null}
    </ModalRoot>
  );
}

export default ContinueShoppingModal;
