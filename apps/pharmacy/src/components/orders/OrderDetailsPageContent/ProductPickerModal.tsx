'use client';

import { useEffect, useId, useState } from 'react';
import { Search, ShoppingCart } from 'lucide-react';

import { Button, CloseIconButton, SvgIcon } from '@e-pharmacy/ui/primitives';
import { CategoryIcon, SearchInput } from '@e-pharmacy/ui/forms';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { InfoTooltip, ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';

import type { ProductDetails } from '@e-pharmacy/types/products';
import type { ProductCategorySlug } from '@e-pharmacy/types/reference-data';

import type { LabeledOption } from '@e-pharmacy/utils/collections';
import { formatMoney } from '@e-pharmacy/utils/money';

import { getProductFilters, getProducts } from '@/lib/api/browser';
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
          <div className={css.productModalSearchLabel}>
            <span>Product search</span>
            <InfoTooltip
              label="Product search help"
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
          </div>
          <SearchInput
            id={searchId}
            label="Product search"
            value={searchValue}
            placeholder="Name, article, or product ID"
            isActive={Boolean(searchValue)}
            onChange={setSearchValue}
          />

          <p className={css.productModalAvailableCount}>
            {`${availableProductsCount.toLocaleString('en-US')} items available`}
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
                onClick={() => setSelectedCategory(category.value)}
              >
                <CategoryIcon name={category.icon} size={16} />
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
            <ProfileResourceState
              variant="loading"
              title="Loading pharmacy products"
              description="Available products are being loaded for this pharmacy."
            />
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
                        {offer?.availableQuantity ?? 0} items available
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
