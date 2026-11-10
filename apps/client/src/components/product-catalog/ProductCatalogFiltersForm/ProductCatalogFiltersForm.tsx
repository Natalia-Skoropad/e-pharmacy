'use client';

import { useMemo } from 'react';

import {
  ArrowDownAZ,
  ArrowUpAZ,
  Building2,
  CalendarDays,
  PackageSearch,
  RotateCcw,
  Search,
  Star,
} from 'lucide-react';

import { CountLabel, formatInitials } from '@e-pharmacy/ui/data-display';

import {
  CategoryIcon,
  SearchableSelect,
  SelectField,
} from '@e-pharmacy/ui/forms';

import { TableImagePreview } from '@e-pharmacy/ui/media';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';
import { ResetFiltersButton } from '@e-pharmacy/ui/primitives';
import type { PharmacyOption } from '@e-pharmacy/types/pharmacies';
import type { ProductFilterOptionsResponse } from '@e-pharmacy/types/products';
import { USER_SEARCH_MAX_LENGTH } from '@e-pharmacy/validation/url';

import {
  buildProductCatalogPath,
  isProductSortFilter,
  type ProductCatalogFilters,
  type ProductCategoryFilter,
  type ProductSortFilter,
} from '@/lib/catalog/product-catalog';

import { sanitizeCatalogTextSearch } from '@/lib/catalog/search-sanitizers';

import CatalogFiltersShell from '@/components/catalog/CatalogFiltersShell/CatalogFiltersShell';
import { useCatalogNavigation } from '@/components/catalog/hooks/useCatalogNavigation';
import { useRemotePharmacyOptions } from '@/components/catalog/hooks/useRemotePharmacyOptions';
import { useRemoteProductOptions } from '@/components/catalog/hooks/useRemoteProductOptions';

import css from './ProductCatalogFiltersForm.module.css';

//===================================================================

type ProductCatalogFiltersFormProps = Readonly<{
  filters: ProductCatalogFilters;
  pharmacies: PharmacyOption[];
  filterOptions: ProductFilterOptionsResponse;
  availableCategories: ProductFilterOptionsResponse['categories'];
  selectedProductName?: string;
  selectedProductImageUrl?: string;
  visibleProductsCount: number;
  productsCount: number;
}>;

//===================================================================

export default function ProductCatalogFiltersForm({
  filters,
  pharmacies,
  filterOptions,
  availableCategories,
  selectedProductName,
  selectedProductImageUrl,
  visibleProductsCount,
  productsCount,
}: ProductCatalogFiltersFormProps) {
  const { isPending, navigate } = useCatalogNavigation();

  // Every select is scoped by the *other* facets, before server pagination.
  // The current facet does not restrict its own available choices.
  const pharmacySearch = useRemotePharmacyOptions('pharmacy', {
    productId: filters.productId,
    category: filters.category !== 'all' ? filters.category : undefined,
  });

  const productSearch = useRemoteProductOptions({
    pharmacyId: filters.pharmacyId,
    category: filters.category !== 'all' ? filters.category : undefined,
  });

  const localPharmacyMatches = useMemo(() => {
    const query = pharmacySearch.isOpen
      ? pharmacySearch.query.trim().toLocaleLowerCase()
      : '';

    return pharmacies.filter((pharmacy) => {
      // Only preserve the selected value. Other options must come from the
      // server-scoped query, not a stale/unrelated local page.
      if (pharmacy.id !== filters.pharmacyId) return false;
      if (!query) return true;

      return [
        pharmacy.name,
        pharmacy.phone,
        pharmacy.email,
        pharmacy.location?.address,
        pharmacy.location?.settlement,
        pharmacy.location?.region,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
        .includes(query);
    });
  }, [
    filters.pharmacyId,
    pharmacies,
    pharmacySearch.isOpen,
    pharmacySearch.query,
  ]);

  const availablePharmacies = useMemo(
    () => [
      ...pharmacySearch.items,

      ...localPharmacyMatches.filter(
        (item) => !pharmacySearch.items.some((loaded) => loaded.id === item.id)
      ),
    ],
    [pharmacySearch.items, localPharmacyMatches]
  );

  const selectedPharmacy = availablePharmacies.find(
    (pharmacy) => pharmacy.id === filters.pharmacyId
  );

  const pharmacyOptions = useMemo(
    () => [
      ...(!pharmacySearch.query.trim()
        ? [{ value: '', label: 'All pharmacies' }]
        : []),

      ...availablePharmacies.map((pharmacy) => ({
        value: pharmacy.id,
        label: pharmacy.name,

        leading: (
          <TableImagePreview
            src={pharmacy.imageUrl}
            alt={`${pharmacy.name} photo`}
            fallback={formatInitials(pharmacy.name, 'P')}
            size={30}
          />
        ),

        searchText: [
          pharmacy.email,
          pharmacy.phone,
          pharmacy.location?.address,
          pharmacy.location?.settlement,
          pharmacy.location?.region,
        ]
          .filter(Boolean)
          .join(' '),
      })),
    ],
    [availablePharmacies, pharmacySearch.query]
  );

  const productOptions = useMemo(
    () => [
      ...(!productSearch.query.trim()
        ? [{ value: '', label: 'All products' }]
        : []),

      ...(!productSearch.query.trim() &&
      filters.productId &&
      selectedProductName &&
      !productSearch.items.some((item) => item.id === filters.productId)
        ? [
            {
              value: filters.productId,
              label: selectedProductName,

              leading: (
                <TableImagePreview
                  src={selectedProductImageUrl}
                  alt={`${selectedProductName} photo`}
                  fallback={formatInitials(selectedProductName, 'P')}
                  size={30}
                />
              ),
            },
          ]
        : []),

      ...productSearch.items.map((product) => ({
        value: product.id,
        label: product.name,
        searchText: product.article,

        leading: (
          <TableImagePreview
            src={product.imageUrl}
            alt={`${product.name} photo`}
            fallback={formatInitials(product.name, 'P')}
            size={30}
          />
        ),
      })),
    ],
    [
      filters.productId,
      selectedProductName,
      selectedProductImageUrl,
      productSearch.items,
      productSearch.query,
    ]
  );

  const categoryOptions = useMemo(() => {
    const selected = filterOptions.categories.find(
      (item) => item.value === filters.category
    );

    const scoped = availableCategories.some(
      (item) => item.value === filters.category
    )
      ? availableCategories
      : selected
        ? [...availableCategories, selected]
        : availableCategories;

    return scoped.map((category) => ({
      ...category,

      content:
        category.value === 'all' ? (
          category.label
        ) : (
          <span className={css.categoryOption}>
            <span className={css.optionIcon}>
              <CategoryIcon name={category.icon} size={16} />
            </span>
            <span>{category.label}</span>
          </span>
        ),
    }));
  }, [availableCategories, filterOptions.categories, filters.category]);

  const sortOptions = useMemo(
    () =>
      filterOptions.sort
        .filter(
          (option): option is { value: ProductSortFilter; label: string } =>
            isProductSortFilter(option.value)
        )
        .map((option) => ({
          ...option,

          content: (
            <span className={css.sortOption}>
              <span
                className={
                  option.value.startsWith('rating')
                    ? css.ratingIcon
                    : css.optionIcon
                }
              >
                {option.value.startsWith('rating') ? (
                  <Star size={16} fill="currentColor" />
                ) : option.value === 'name-asc' ? (
                  <ArrowDownAZ size={16} />
                ) : option.value === 'name-desc' ? (
                  <ArrowUpAZ size={16} />
                ) : (
                  <CalendarDays size={16} />
                )}
              </span>
              <span>{option.label}</span>
            </span>
          ),
        })),
    [filterOptions.sort]
  );

  const hasActiveFilters = Boolean(
    filters.productId ||
    filters.category !== 'all' ||
    filters.pharmacyId ||
    filters.sort !== 'newest' ||
    filters.name ||
    filters.article
  );

  const updateFilters = (next: Partial<ProductCatalogFilters>) =>
    navigate(
      buildProductCatalogPath(
        { ...filters, ...next, page: 1 },
        availablePharmacies
      )
    );

  const resetHref = buildProductCatalogPath(
    { category: 'all', sort: 'newest' },
    availablePharmacies
  );

  return (
    <CatalogFiltersShell
      headingId="product-catalog-filters-title"
      heading="Product catalog filters"
      layout="product"
      isPending={isPending}
      searchFields={
        <SearchableSelect
          id="catalog-product-search"
          label="Product search"
          labelAccessory={
            <InfoTooltip
              label="Product search help"
              title="Product search"
              icon={<PackageSearch size={20} aria-hidden="true" />}
              items={[
                {
                  title: 'Search fields',
                  icon: <Search size={17} aria-hidden="true" />,
                  description: 'Find products by name or article.',
                },
              ]}
            />
          }
          value={filters.productId ?? ''}
          options={productOptions}
          selectedFallbackLabel={selectedProductName}
          placeholder="Article or product name"
          emptyMessage="No matching products"
          loadingMessage="Loading products..."
          filterOptions={false}
          onOpenChange={productSearch.setIsOpen}
          onQueryChange={productSearch.setQuery}
          isOptionsLoading={productSearch.isOptionsLoading}
          hasMoreOptions={productSearch.hasMore}
          isLoadingMore={productSearch.isLoadingMore}
          loadMoreError={productSearch.error}
          loadMoreErrorVariant="notice"
          onLoadMore={productSearch.loadMore}
          isActive={Boolean(filters.productId)}
          isLoading={isPending}
          disabled={isPending}
          maxLength={USER_SEARCH_MAX_LENGTH}
          sanitizeQuery={sanitizeCatalogTextSearch}
          onChange={(productId) =>
            updateFilters({
              productId: productId || undefined,
              name: '',
              article: '',
            })
          }
        />
      }
      desktopFilterFields={
        <>
          <SearchableSelect
            id="catalog-pharmacy-search"
            label="Pharmacy search"
            labelAccessory={
              <InfoTooltip
                label="Pharmacy search help"
                title="Pharmacy search"
                icon={<Building2 size={20} aria-hidden="true" />}
                items={[
                  {
                    title: 'Search fields',
                    icon: <Search size={17} aria-hidden="true" />,
                    description:
                      'Search pharmacies by name, phone, email or address.',
                  },
                ]}
              />
            }
            value={filters.pharmacyId ?? ''}
            options={pharmacyOptions}
            selectedFallbackLabel={selectedPharmacy?.name}
            filterOptions={false}
            onOpenChange={pharmacySearch.setIsOpen}
            onQueryChange={pharmacySearch.setQuery}
            isOptionsLoading={
              pharmacySearch.isOptionsLoading &&
              localPharmacyMatches.length === 0
            }
            hasMoreOptions={pharmacySearch.hasMore}
            isLoadingMore={pharmacySearch.isLoadingMore}
            loadMoreError={pharmacySearch.error}
            loadMoreErrorVariant="notice"
            onLoadMore={pharmacySearch.loadMore}
            placeholder="Name, phone, email, or address"
            emptyMessage="No pharmacies found"
            isActive={Boolean(filters.pharmacyId)}
            isLoading={isPending}
            disabled={isPending}
            maxLength={USER_SEARCH_MAX_LENGTH}
            sanitizeQuery={sanitizeCatalogTextSearch}
            onChange={(pharmacyId) =>
              updateFilters({ pharmacyId: pharmacyId || undefined })
            }
          />
          <SelectField
            id="catalog-category"
            label="Product category"
            value={filters.category}
            options={categoryOptions}
            isActive={filters.category !== 'all'}
            disabled={isPending}
            onChange={(category: ProductCategoryFilter) =>
              updateFilters({ category })
            }
          />
        </>
      }
      resetAction={
        hasActiveFilters ? (
          <ResetFiltersButton
            label={
              <>
                <RotateCcw size={16} aria-hidden="true" /> Reset filters
              </>
            }
            disabled={isPending}
            onClick={() => navigate(resetHref)}
          />
        ) : null
      }
      countLabel={
        <CountLabel
          shown={visibleProductsCount}
          total={productsCount}
          label="products"
          fullWidthOnMobile
        />
      }
      filterButton={null}
      desktopSort={
        <SelectField
          id="catalog-sort"
          label="Sort by"
          className={css.sortField}
          value={filters.sort}
          options={sortOptions}
          isActive={filters.sort !== 'newest'}
          disabled={isPending}
          onChange={(sort: ProductSortFilter) => updateFilters({ sort })}
        />
      }
      drawer={null}
    />
  );
}
