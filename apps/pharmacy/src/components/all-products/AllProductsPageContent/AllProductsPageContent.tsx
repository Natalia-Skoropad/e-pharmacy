'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  CountLabel,
  DataTable,
  Pagination,
  SearchInput,
  SelectField,
  StatusBadge,
  StatusBanner,
  type DataTableColumn,
  type SelectOption,
} from '@e-pharmacy/ui/common';

import { PRODUCT_CATEGORIES } from '@e-pharmacy/types/products';

import type {
  Product,
  ProductCategory,
  ProductsQueryParams,
} from '@e-pharmacy/types';

import { formatPrice, formatShortDate } from '@e-pharmacy/utils/formatters';

import { getProducts } from '@/lib/api/browser';
import { getPharmacyAllProductPath } from '@/lib/pharmacy/routes';

import css from './AllProductsPageContent.module.css';

//===================================================================

type CategoryFilter = 'all' | ProductCategory;
type SortFilter = NonNullable<ProductsQueryParams['sort']>;

const PRODUCTS_PER_PAGE = 12;

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  medicine: 'Medicine',
  vitamins: 'Vitamins',
  beauty: 'Beauty',
  hygiene: 'Hygiene',
  medical_devices: 'Medical devices',
  other: 'Other',
};

const CATEGORY_OPTIONS: Array<SelectOption<CategoryFilter>> = [
  { value: 'all', label: 'All categories' },
  ...PRODUCT_CATEGORIES.map((category) => ({
    value: category,
    label: CATEGORY_LABELS[category],
  })),
];

const SORT_OPTIONS: Array<SelectOption<SortFilter>> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'rating-desc', label: 'Rating: highest first' },
  { value: 'rating-asc', label: 'Rating: lowest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

//===================================================================

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function getPageFromHref(href: string): number {
  const page = Number(href.replace('#page-', ''));
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function AllProductsPageContent() {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sort, setSort] = useState<SortFilter>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo<ProductsQueryParams>(
    () => ({
      page,
      perPage: PRODUCTS_PER_PAGE,
      keyword: search.trim() || undefined,
      category: category === 'all' ? undefined : category,
      sort,
    }),
    [category, page, search, sort]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getProducts(params);
        if (!isMounted) return;

        setItems(response.items);
        setTotal(response.total);
        setTotalPages(Math.max(1, response.totalPages));
      } catch (loadError) {
        if (!isMounted) return;
        setItems([]);
        setTotal(0);
        setTotalPages(1);
        setError(getErrorMessage(loadError, 'Could not load products.'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [params]);

  const columns = useMemo<Array<DataTableColumn<Product>>>(
    () => [
      {
        key: 'updatedAt',
        title: 'Updated date',
        render: (product) => (
          <time dateTime={product.updatedAt}>
            {formatShortDate(product.updatedAt)}
          </time>
        ),
      },
      {
        key: 'article',
        title: 'Article',
        render: (product) => (
          <span className={css.muted}>{product.article}</span>
        ),
      },
      {
        key: 'name',
        title: 'Name',
        render: (product) => (
          <Link
            className={css.productLink}
            href={getPharmacyAllProductPath(product.id)}
          >
            {product.name}
          </Link>
        ),
      },
      {
        key: 'category',
        title: 'Category',
        render: (product) => CATEGORY_LABELS[product.category],
      },
      {
        key: 'price',
        title: 'Average price',
        align: 'right',
        render: (product) => formatPrice(product.price),
      },
      {
        key: 'pharmacies',
        title: 'In pharmacies',
        align: 'center',
        render: (product) => product.availableInPharmaciesCount,
      },
      {
        key: 'status',
        title: 'Status',
        render: (product) => <StatusBadge status={product.status} />,
      },
      {
        key: 'action',
        title: 'Action',
        align: 'center',
        render: () => (
          <Button type="button" size="sm" variant="secondary" disabled>
            Locked
          </Button>
        ),
      },
    ],
    []
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value: CategoryFilter) => {
    setCategory(value);
    setPage(1);
  };

  const handleSortChange = (value: SortFilter) => {
    setSort(value);
    setPage(1);
  };

  return (
    <main className={css.page} aria-labelledby="all-products-page-title">
      <div className={css.pageHeader}>
        <h1 className={css.title} id="all-products-page-title">
          All products
        </h1>
        <p className={css.description}>
          Browse real active Admin products. A new pharmacy can view the
          catalog, but adding products unlocks after verification.
        </p>
      </div>

      <div className={css.contentCard}>
        <div className={css.stack}>
          <StatusBanner
            status="new"
            label="New"
            title="Catalog is available in read-only mode"
            message="Only active Admin products are shown here. Adding products to your pharmacy becomes available after Admin verifies your pharmacy profile."
          />

          <div className={css.toolbar}>
            <div className={css.toolbarGrid}>
              <SearchInput
                id="all-products-search"
                label="Search by name or article"
                value={search}
                placeholder="Start typing"
                isActive={Boolean(search)}
                onChange={handleSearchChange}
              />

              <SelectField
                id="all-products-category"
                label="Category"
                value={category}
                options={CATEGORY_OPTIONS}
                isActive={category !== 'all'}
                onChange={handleCategoryChange}
              />

              <SelectField
                id="all-products-sort"
                label="Sort"
                value={sort}
                options={SORT_OPTIONS}
                isActive={sort !== 'newest'}
                onChange={handleSortChange}
              />
            </div>
          </div>

          {error ? (
            <StatusBanner
              status="rejected"
              title="Products could not be loaded"
              message={error}
            />
          ) : null}

          <CountLabel shown={items.length} total={total} label="products" />

          <DataTable
            columns={columns}
            items={items}
            getItemKey={(product) => product.id}
            isLoading={isLoading}
            minWidth={1080}
            labels={{
              loading: 'Loading real products...',
              empty: 'No active Admin products match the selected filters.',
            }}
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            getPageHref={(nextPage) => `#page-${nextPage}`}
            ariaLabel="All products pagination"
            renderLink={({
              href,
              className,
              children,
              'aria-label': ariaLabel,
            }) => (
              <button
                type="button"
                className={className}
                aria-label={ariaLabel}
                onClick={() => setPage(getPageFromHref(href))}
              >
                {children}
              </button>
            )}
          />
        </div>
      </div>
    </main>
  );
}

export default AllProductsPageContent;
export { AllProductsPageContent };
