'use client';

import { useEffect, useId, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

import { PRODUCT_CATEGORY_LABELS } from '@e-pharmacy/config/presentation';

import {
  Button,
  CloseIconButton,
  LoadingSpinner,
  SvgIcon,
} from '@e-pharmacy/ui/primitives';

import { SearchInput } from '@e-pharmacy/ui/forms';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';

import type {
  ProductCategory,
  ProductDetails,
} from '@e-pharmacy/types/products';

import type { LabeledOption } from '@e-pharmacy/utils/collections';
import { formatMoney } from '@e-pharmacy/utils/money';
import { formatStockLabel } from '@e-pharmacy/utils/numbers';

import { getProductFilters, getProducts } from '@/lib/api/browser';
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
    ProductCategory | 'all'
  >('all');

  const [categoryOptions, setCategoryOptions] = useState<
    readonly LabeledOption<ProductCategory>[]
  >([]);

  const [availableProductsCount, setAvailableProductsCount] = useState(0);
  const [products, setProducts] = useState<ProductDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingProductIds, setAddingProductIds] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const response = await getProductFilters(
          {
            pharmacyId: order.pharmacyId,
            inStock: true,
          },
          { signal: controller.signal }
        );

        setCategoryOptions(
          response.categories.flatMap((option) =>
            option.value === 'all'
              ? []
              : [{ value: option.value, label: option.label }]
          )
        );
      } catch {
        if (!controller.signal.aborted) {
          setError('Could not load product categories for this pharmacy.');
        }
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
        setError('');

        const response = await getProducts(
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

        setProducts([...response.items]);
        setAvailableProductsCount(response.total);
      } catch {
        if (!controller.signal.aborted) {
          setError('Could not load products from this pharmacy.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [order.pharmacyId, searchValue, selectedCategory]);

  const handleAddProduct = async (product: ProductDetails) => {
    if (addingProductIds.has(product.id)) return;

    setAddingProductIds((current) => {
      const next = new Set(current);
      next.add(product.id);
      return next;
    });

    try {
      await onAddProduct(product);
    } finally {
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
            label="Search products"
            value={searchValue}
            placeholder="Add one more product"
            isActive={Boolean(searchValue)}
            onChange={setSearchValue}
          />

          <p className={css.productModalAvailableCount}>
            {formatStockLabel(availableProductsCount) ?? '—'}
          </p>
        </div>

        {categoryOptions.length > 0 ? (
          <div
            className={css.productModalCategories}
            aria-label="Product categories in this pharmacy"
          >
            <button
              className={
                selectedCategory === 'all'
                  ? css.productModalCategoryActive
                  : css.productModalCategory
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
                    ? css.productModalCategoryActive
                    : css.productModalCategory
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
          <p className={css.productModalNotice} role="alert">
            {error}
          </p>
        ) : null}

        <div className={css.productModalResults}>
          {isLoading ? (
            <LoadingSpinner label="Loading pharmacy products..." />
          ) : null}

          {!isLoading && products.length === 0 ? (
            <p className={css.productModalStatus}>
              No matching products in this pharmacy.
            </p>
          ) : null}

          {!isLoading && products.length > 0 ? (
            <ul className={css.productModalList}>
              {products.map((product) => {
                const offer = getProductOffer(product, order.pharmacyId);

                const isInOrder = Boolean(
                  offer &&
                  order.items.some((item) => item.productOfferId === offer.id)
                );

                const isAdding = addingProductIds.has(product.id);

                const categoryLabel =
                  PRODUCT_CATEGORY_LABELS[product.category] ?? product.category;

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
                      <p className={css.productModalMeta}>{categoryLabel}</p>

                      {product.manufacturer ? (
                        <p className={css.productModalManufacturer}>
                          {product.manufacturer}
                        </p>
                      ) : null}
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
                          isAdding
                        }
                        onClick={() => void handleAddProduct(product)}
                      >
                        {isInOrder ? (
                          'In order'
                        ) : isAdding ? (
                          'Adding...'
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
