'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Search, ShoppingCart, X } from 'lucide-react';

import { Button, ShimmerImage, SvgIcon } from '@/components/common';

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

const PRODUCTS_LIMIT = 30;

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
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingProductId, setIsAddingProductId] = useState<string | null>(null);
  const [error, setError] = useState('');

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
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;

    async function fetchStoreCategories() {
      try {
        const response = await getProducts({
          storeId,
          page: 1,
          perPage: 100,
          inStock: true,
        });

        if (!isMounted) return;

        setCategoryProducts(response.items);
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
    } catch {
      setError('Could not add this product to the invoice.');
    } finally {
      setIsAddingProductId(null);
    }
  };

  return (
    <div className={css.backdrop} role="presentation" onMouseDown={onClose}>
      <div
        className={css.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={css.head}>
          <div>
            <p className={css.kicker}>{storeName}</p>
            <h2 className={css.title} id={titleId}>
              Continue shopping
            </h2>
          </div>

          <button className={css.closeButton} type="button" onClick={onClose} aria-label="Close modal">
            <X size={28} aria-hidden="true" />
          </button>
        </div>

        <label className={css.searchField} htmlFor={searchId}>
          <Search className={css.searchIcon} size={28} aria-hidden="true" />
          <input
            id={searchId}
            type="search"
            value={searchValue}
            placeholder="Add one more product"
            autoComplete="off"
            maxLength={80}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </label>

        {categoryOptions.length > 0 ? (
          <div className={css.categories} aria-label="Product categories in this pharmacy">
            <button
              className={selectedCategory === 'all' ? css.categoryActive : css.category}
              type="button"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </button>

            {categoryOptions.map((category) => (
              <button
                className={selectedCategory === category.value ? css.categoryActive : css.category}
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
            <p className={css.status} role="status">
              Loading pharmacy products...
            </p>
          ) : null}

          {!isLoading && products.length === 0 ? (
            <p className={css.status}>No matching products in this pharmacy.</p>
          ) : null}

          {!isLoading && products.length > 0 ? (
            <ul className={css.productList}>
              {products.map((product) => {
                const isInCart = cartProductIds.has(product.id);
                const isAdding = isAddingProductId === product.id;

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
                        <div className={css.productImageFallback} aria-hidden="true">
                          <SvgIcon name="icon-shopping-cart" size={24} />
                        </div>
                      )}
                    </div>

                    <div className={css.productInfo}>
                      <h3 className={css.productName}>{product.name}</h3>
                      {product.manufacturer ? (
                        <p className={css.productMeta}>{product.manufacturer}</p>
                      ) : null}
                    </div>

                    <p className={css.productPrice}>{formatPrice(getStoreProductPrice(product, storeId))}</p>

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
      </div>
    </div>
  );
}

export default ContinueShoppingModal;
