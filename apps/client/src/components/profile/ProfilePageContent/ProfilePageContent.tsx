'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Building2, Heart, KeyRound, MonitorSmartphone } from 'lucide-react';

import {
  DELIVERY_METHODS,
  ORDER_CREATED_BY_TYPES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
} from '@e-pharmacy/config/orders';

import {
  DELIVERY_METHOD_LABELS,
  ORDER_CREATED_BY_LABELS,
  ORDER_STATUS_PRESENTATION,
  PAYMENT_METHOD_LABELS,
  USER_ROLE_LABELS,
  USER_STATUS_PRESENTATION,
} from '@e-pharmacy/config/presentation';

import {
  Button,
  FiltersButton,
  LoadingSpinner,
  TextActionButton,
} from '@e-pharmacy/ui/primitives';

import { LinkButton, PaginationView, Tabs } from '@e-pharmacy/ui/navigation';

import {
  CountLabel,
  DataTable,
  formatInitials,
  TableDateTime,
  TableHeaderTitle,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { PictureCard, TableImagePreview } from '@e-pharmacy/ui/media';

import {
  AddressInput,
  DateFilter,
  NameInput,
  PasswordInput,
  PhoneInput,
  RowsPerPageSelect,
  SearchInput,
  SelectField,
  type RowsPerPageValue,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer } from '@e-pharmacy/ui/overlays';

import { getAuthErrorCode } from '@e-pharmacy/auth/errors';
import { useAuth } from '@e-pharmacy/auth/react';
import { useToast } from '@e-pharmacy/ui/feedback';
import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs } from '@e-pharmacy/ui/navigation';
import { formatAmount } from '@e-pharmacy/utils/money';
import { formatShortDate } from '@e-pharmacy/utils/date';
import { countTrueConditions } from '@e-pharmacy/utils/collections';

import {
  CHANGE_PASSWORD_FORM_FIELDS,
  CHANGE_PASSWORD_INITIAL_VALUES,
  USER_ADDRESS_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  DATA_PROFILE_FORM_FIELDS,
  hasValidationErrors,
  isChangePasswordFormDirty,
  isChangePasswordFormValid,
  isDataProfileFormDirty,
  isDataProfileFormValid,
  markAllFieldsTouched,
  normalizeDataProfileUpdateValues,
  normalizePhoneInput,
  validateChangePasswordForm,
  validateDataProfileForm,
  type ChangePasswordFormValues,
  type ChangePasswordTouchedFields,
  type DataProfileFormValues,
  type DataProfileTouchedFields,
} from '@e-pharmacy/validation/profile';

import {
  PICTURE_ACCEPT,
  buildPictureFileError,
  buildPictureUrlError,
} from '@e-pharmacy/validation/files';

import type { ActiveSession, AuthUser } from '@e-pharmacy/types/auth';

import type {
  ClientOrder,
  DeliveryMethod,
  OrderCreatedByType,
  OrderStatus,
  PaymentMethod,
} from '@e-pharmacy/types/orders';

import type { PharmacyCardSummary } from '@e-pharmacy/types/pharmacies';
import type { ProductCardSummary } from '@e-pharmacy/types/products';

import { getClientPasswordChangeErrorMessage } from '@/lib/auth';
import { PROFILE_TITLE } from '@/lib/seo/metadata-copy';
import { getUserFacingErrorMessage } from '@/lib/errors/get-user-facing-error-message';

import {
  ROUTES,
  buildOrderPath,
  buildPharmacyPath,
  createBreadcrumbs,
} from '@/lib/routes';

import {
  getOrders,
  getActiveSessions,
  revokeActiveSession,
  getFavoriteProducts,
  getFavoritePharmacies,
  updateCurrentUser,
  updateCurrentUserPassword,
} from '@/lib/api/browser';

import { ProductCard } from '@/components/product-catalog';
import { PharmacyCard } from '@/components/pharmacies';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import { isCurrentFavoriteRequest } from './favorite-request-lifecycle';
import css from './ProfilePageContent.module.css';

//===================================================================

type ProfileTab =
  | 'data'
  | 'orders'
  | 'favorite-products'
  | 'favorite-pharmacies'
  | 'sessions';

//===================================================================

const TABS: Array<{
  value: ProfileTab;
  label: string;
}> = [
  { value: 'data', label: 'My data' },
  { value: 'orders', label: 'My orders' },
  { value: 'favorite-products', label: 'Favorite products' },
  { value: 'favorite-pharmacies', label: 'Favorite pharmacies' },
  { value: 'sessions', label: 'Active sessions' },
];

//===================================================================

const FAVORITES_PER_PAGE = 16;
const FAVORITE_COUNTS_PER_PAGE = 1;

//===================================================================

type ClientOrdersFilterState = Readonly<{
  date: { from: string; to: string };
  pharmacy: string;
  orderNumber: string;
  deliveryMethod: 'all' | DeliveryMethod;
  paymentMethod: 'all' | PaymentMethod;
  status: 'all' | OrderStatus;
  createdByType: 'all' | OrderCreatedByType;
}>;

const DEFAULT_CLIENT_ORDERS_FILTERS: ClientOrdersFilterState = {
  date: { from: '', to: '' },
  pharmacy: '',
  orderNumber: '',
  deliveryMethod: 'all',
  paymentMethod: 'all',
  status: 'all',
  createdByType: 'all',
};

const DELIVERY_METHOD_OPTIONS: Array<
  SelectOption<ClientOrdersFilterState['deliveryMethod']>
> = [
  { value: 'all', label: 'All' },
  ...DELIVERY_METHODS.map((deliveryMethod) => ({
    value: deliveryMethod,
    label: DELIVERY_METHOD_LABELS[deliveryMethod],
  })),
];

const PAYMENT_METHOD_OPTIONS: Array<
  SelectOption<ClientOrdersFilterState['paymentMethod']>
> = [
  { value: 'all', label: 'All' },
  ...PAYMENT_METHODS.map((paymentMethod) => ({
    value: paymentMethod,
    label: PAYMENT_METHOD_LABELS[paymentMethod],
  })),
];

const ORDER_STATUS_OPTIONS: Array<
  SelectOption<ClientOrdersFilterState['status']>
> = [
  { value: 'all', label: 'All' },
  ...ORDER_STATUSES.map((status) => ({
    value: status,
    label: ORDER_STATUS_PRESENTATION[status].label,
  })),
];

const ORDER_CREATED_BY_OPTIONS: Array<
  SelectOption<ClientOrdersFilterState['createdByType']>
> = [
  { value: 'all', label: 'All' },
  ...ORDER_CREATED_BY_TYPES.map((createdByType) => ({
    value: createdByType,
    label: ORDER_CREATED_BY_LABELS[createdByType],
  })),
];

//===================================================================

function AuthenticatedProfilePageContent({
  user,
}: Readonly<{
  user: AuthUser;
}>) {
  const {
    canRenderAuthenticatedContent,
    applyCurrentUser,
    invalidateSession,
    logoutAll,
  } = useAuth();

  const toast = useToast();
  const canUseAuthFeatures = canRenderAuthenticatedContent;
  const [activeTab, setActiveTab] = useState<ProfileTab>('data');

  const serverProfileValues = useMemo<DataProfileFormValues>(
    () => ({
      name: user.name ?? '',
      phone: user.phone ?? '',
      address: user.address ?? '',
    }),
    [user.address, user.name, user.phone]
  );

  const [profileDraft, setProfileDraft] = useState<{
    values: DataProfileFormValues;
    baseline: DataProfileFormValues;
  } | null>(null);

  const profileValues = profileDraft?.values ?? serverProfileValues;

  const [profileTouchedFields, setProfileTouchedFields] =
    useState<DataProfileTouchedFields>({});

  const [passwordValues, setPasswordValues] =
    useState<ChangePasswordFormValues>(CHANGE_PASSWORD_INITIAL_VALUES);

  const [passwordTouchedFields, setPasswordTouchedFields] =
    useState<ChangePasswordTouchedFields>({});

  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] =
    useState(false);

  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [pictureDraft, setPictureDraft] = useState<string | null | undefined>(
    undefined
  );
  const picturePreview =
    pictureDraft === undefined ? (user.pictureUrl ?? null) : pictureDraft;
  const [orders, setOrders] = useState<ClientOrder[]>([]);

  const [ordersFilters, setOrdersFilters] = useState<ClientOrdersFilterState>(
    DEFAULT_CLIENT_ORDERS_FILTERS
  );

  const [ordersRowsPerPage, setOrdersRowsPerPage] =
    useState<RowsPerPageValue>(20);

  const [ordersCurrentPage, setOrdersCurrentPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersTotalPages, setOrdersTotalPages] = useState(0);

  const [ordersEarliestCreatedAt, setOrdersEarliestCreatedAt] = useState<
    string | null
  >(null);

  const [isOrdersFiltersOpen, setIsOrdersFiltersOpen] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState('');

  const [favoriteProducts, setFavoriteProducts] = useState<
    ProductCardSummary[]
  >([]);

  const [favoritePharmacies, setFavoritePharmacies] = useState<
    PharmacyCardSummary[]
  >([]);

  const [favoriteProductsError, setFavoriteProductsError] = useState('');
  const [favoritePharmaciesError, setFavoritePharmaciesError] = useState('');
  const [favoriteProductsCount, setFavoriteProductsCount] = useState(0);
  const [favoritePharmaciesCount, setFavoritePharmaciesCount] = useState(0);
  const [favoriteProductsPage, setFavoriteProductsPage] = useState(0);

  const [favoriteProductsTotalPages, setFavoriteProductsTotalPages] =
    useState(0);

  const [favoritePharmaciesPage, setFavoritePharmaciesPage] = useState(0);

  const [favoritePharmaciesTotalPages, setFavoritePharmaciesTotalPages] =
    useState(0);

  const [isFavoriteProductsLoading, setIsFavoriteProductsLoading] =
    useState(false);

  const [isFavoritePharmaciesLoading, setIsFavoritePharmaciesLoading] =
    useState(false);

  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [passwordSubmitError, setPasswordSubmitError] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isPictureSaving, setIsPictureSaving] = useState(false);
  const profileMutationInFlightRef = useRef(false);
  const passwordMutationInFlightRef = useRef(false);
  const sessionMutationInFlightRef = useRef(false);
  const favoriteProductsAbortRef = useRef<AbortController | null>(null);
  const favoriteProductsCountAbortRef = useRef<AbortController | null>(null);
  const favoriteProductsRequestVersionRef = useRef(0);
  const favoritePharmaciesAbortRef = useRef<AbortController | null>(null);
  const favoritePharmaciesCountAbortRef = useRef<AbortController | null>(null);
  const favoritePharmaciesRequestVersionRef = useRef(0);

  const profileErrors = useMemo(
    () => validateDataProfileForm(profileValues),
    [profileValues]
  );

  const passwordErrors = useMemo(
    () => validateChangePasswordForm(passwordValues),
    [passwordValues]
  );

  const profileFormIsValid = isDataProfileFormValid(profileValues);

  const profileFormIsDirty = profileDraft !== null;

  const passwordFormIsDirty = isChangePasswordFormDirty(passwordValues);
  const passwordFormIsValid = isChangePasswordFormValid(passwordValues);
  const effectiveFavoriteProductsCount = canUseAuthFeatures
    ? favoriteProductsCount
    : 0;
  const effectiveFavoritePharmaciesCount = canUseAuthFeatures
    ? favoritePharmaciesCount
    : 0;
  const effectiveOrdersCount = canUseAuthFeatures ? ordersTotal : 0;

  const tabs = useMemo(
    () =>
      TABS.map((tab) => {
        if (tab.value === 'favorite-products') {
          return {
            ...tab,
            label: `${tab.label} (${effectiveFavoriteProductsCount})`,
          };
        }

        if (tab.value === 'favorite-pharmacies') {
          return {
            ...tab,
            label: `${tab.label} (${effectiveFavoritePharmaciesCount})`,
          };
        }

        if (tab.value === 'orders') {
          return {
            ...tab,
            label: `${tab.label} (${effectiveOrdersCount})`,
          };
        }

        return tab;
      }),
    [
      effectiveFavoritePharmaciesCount,
      effectiveFavoriteProductsCount,
      effectiveOrdersCount,
    ]
  );

  const ordersQueryParams = useMemo(
    () => ({
      page: ordersCurrentPage,
      perPage: ordersRowsPerPage,
      dateFrom: ordersFilters.date.from || undefined,
      dateTo: ordersFilters.date.to || undefined,
      pharmacy: ordersFilters.pharmacy.trim() || undefined,
      orderNumber: ordersFilters.orderNumber.trim() || undefined,
      deliveryMethod:
        ordersFilters.deliveryMethod === 'all'
          ? undefined
          : ordersFilters.deliveryMethod,
      paymentMethod:
        ordersFilters.paymentMethod === 'all'
          ? undefined
          : ordersFilters.paymentMethod,
      status: ordersFilters.status === 'all' ? undefined : ordersFilters.status,
      createdByType:
        ordersFilters.createdByType === 'all'
          ? undefined
          : ordersFilters.createdByType,
    }),
    [ordersCurrentPage, ordersFilters, ordersRowsPerPage]
  );

  const ordersActiveFiltersCount = countTrueConditions(
    Boolean(ordersFilters.date.from || ordersFilters.date.to),
    Boolean(ordersFilters.pharmacy.trim()),
    Boolean(ordersFilters.orderNumber.trim()),
    ordersFilters.deliveryMethod !== 'all',
    ordersFilters.paymentMethod !== 'all',
    ordersFilters.status !== 'all',
    ordersFilters.createdByType !== 'all'
  );

  const hasActiveOrdersFilters = ordersActiveFiltersCount > 0;

  const orderColumns = useMemo<Array<DataTableColumn<ClientOrder>>>(
    () => [
      {
        key: 'date',
        title: <TableHeaderTitle parts={['Order', 'date']} />,
        render: (order) => <TableDateTime value={order.createdAt} />,
      },
      {
        key: 'orderNumber',
        title: <TableHeaderTitle parts={['Order', 'number']} />,
        render: (order) => (
          <TextActionButton
            className={css.orderLink}
            href={buildOrderPath(order)}
          >
            {order.orderNumber}
          </TextActionButton>
        ),
      },
      {
        key: 'pharmacyPhoto',
        title: <TableHeaderTitle parts={['Pharmacy', 'photo']} />,
        render: (order) => (
          <TableImagePreview
            src={order.pharmacyImageUrl}
            alt={`${order.pharmacyName} photo`}
            fallback={formatInitials(order.pharmacyName, 'P')}
          />
        ),
      },
      {
        key: 'pharmacy',
        title: <TableHeaderTitle parts={['Pharmacy', 'name']} />,
        render: (order) => (
          <TextActionButton
            className={css.pharmacyLink}
            href={buildPharmacyPath(order.pharmacyName, order.pharmacyId)}
          >
            {order.pharmacyName}
          </TextActionButton>
        ),
      },
      {
        key: 'deliveryMethod',
        title: <TableHeaderTitle parts={['Delivery', 'method']} />,
        render: (order) => DELIVERY_METHOD_LABELS[order.delivery.method],
      },
      {
        key: 'paymentMethod',
        title: <TableHeaderTitle parts={['Payment', 'method']} />,
        render: (order) => PAYMENT_METHOD_LABELS[order.paymentMethod],
      },
      {
        key: 'totalQuantity',
        title: <TableHeaderTitle parts={['Total', 'quantity']} />,
        render: (order) => order.totalItems,
      },
      {
        key: 'amount',
        title: <TableHeaderTitle parts={['Order amount,', '₴']} />,
        render: (order) => formatAmount(order.totalPrice) ?? '—',
      },
      {
        key: 'createdBy',
        title: <TableHeaderTitle parts={['Created', 'by']} />,
        render: (order) => ORDER_CREATED_BY_LABELS[order.createdByType],
      },
      {
        key: 'status',
        title: <TableHeaderTitle parts={['Order', 'status']} />,
        render: (order) => (
          <StatusBadge {...ORDER_STATUS_PRESENTATION[order.status]} />
        ),
      },
    ],
    []
  );

  const visibleFavoriteProducts = canUseAuthFeatures ? favoriteProducts : [];
  const visibleFavoritePharmacies = canUseAuthFeatures
    ? favoritePharmacies
    : [];

  const hiddenFavoriteProductsCount = Math.max(
    effectiveFavoriteProductsCount - visibleFavoriteProducts.length,
    0
  );
  const hiddenFavoritePharmaciesCount = Math.max(
    effectiveFavoritePharmaciesCount - visibleFavoritePharmacies.length,
    0
  );

  const loadFavoriteProducts = useCallback(async (page = 1) => {
    favoriteProductsAbortRef.current?.abort();
    favoriteProductsCountAbortRef.current?.abort();

    const controller = new AbortController();
    const requestVersion = favoriteProductsRequestVersionRef.current + 1;
    favoriteProductsAbortRef.current = controller;
    favoriteProductsRequestVersionRef.current = requestVersion;

    const isCurrentRequest = () =>
      isCurrentFavoriteRequest({
        currentVersion: favoriteProductsRequestVersionRef.current,
        requestVersion,
        aborted: controller.signal.aborted,
      });

    try {
      setIsFavoriteProductsLoading(true);
      setFavoriteProductsError('');

      const response = await getFavoriteProducts(
        {
          page,
          perPage: FAVORITES_PER_PAGE,
          sort: 'name-asc',
        },
        { signal: controller.signal }
      );

      if (!isCurrentRequest()) return;

      setFavoriteProducts((current) =>
        page === 1 ? [...response.items] : [...current, ...response.items]
      );
      setFavoriteProductsCount(response.total);
      setFavoriteProductsPage(response.page);
      setFavoriteProductsTotalPages(response.totalPages);
    } catch {
      if (!isCurrentRequest()) return;

      setFavoriteProductsError('Could not load favorite products.');
      if (page === 1) setFavoriteProductsCount(0);
    } finally {
      if (favoriteProductsRequestVersionRef.current === requestVersion) {
        if (favoriteProductsAbortRef.current === controller) {
          favoriteProductsAbortRef.current = null;
        }

        if (!controller.signal.aborted) {
          setIsFavoriteProductsLoading(false);
        }
      }
    }
  }, []);

  const loadFavoritePharmacies = useCallback(async (page = 1) => {
    favoritePharmaciesAbortRef.current?.abort();
    favoritePharmaciesCountAbortRef.current?.abort();

    const controller = new AbortController();
    const requestVersion = favoritePharmaciesRequestVersionRef.current + 1;
    favoritePharmaciesAbortRef.current = controller;
    favoritePharmaciesRequestVersionRef.current = requestVersion;

    const isCurrentRequest = () =>
      isCurrentFavoriteRequest({
        currentVersion: favoritePharmaciesRequestVersionRef.current,
        requestVersion,
        aborted: controller.signal.aborted,
      });

    try {
      setIsFavoritePharmaciesLoading(true);
      setFavoritePharmaciesError('');

      const response = await getFavoritePharmacies(
        {
          page,
          perPage: FAVORITES_PER_PAGE,
          sort: 'name-asc',
        },
        { signal: controller.signal }
      );

      if (!isCurrentRequest()) return;

      setFavoritePharmacies((current) =>
        page === 1 ? [...response.items] : [...current, ...response.items]
      );
      setFavoritePharmaciesCount(response.total);
      setFavoritePharmaciesPage(response.page);
      setFavoritePharmaciesTotalPages(response.totalPages);
    } catch {
      if (!isCurrentRequest()) return;

      setFavoritePharmaciesError('Could not load favorite pharmacies.');
      if (page === 1) setFavoritePharmaciesCount(0);
    } finally {
      if (favoritePharmaciesRequestVersionRef.current === requestVersion) {
        if (favoritePharmaciesAbortRef.current === controller) {
          favoritePharmaciesAbortRef.current = null;
        }

        if (!controller.signal.aborted) {
          setIsFavoritePharmaciesLoading(false);
        }
      }
    }
  }, []);

  const loadFavoriteCounts = useCallback(async () => {
    favoriteProductsCountAbortRef.current?.abort();
    favoritePharmaciesCountAbortRef.current?.abort();

    const productsController = new AbortController();
    const pharmaciesController = new AbortController();
    const productsListVersion = favoriteProductsRequestVersionRef.current;
    const pharmaciesListVersion = favoritePharmaciesRequestVersionRef.current;

    favoriteProductsCountAbortRef.current = productsController;
    favoritePharmaciesCountAbortRef.current = pharmaciesController;

    const [productsResult, pharmaciesResult] = await Promise.allSettled([
      getFavoriteProducts(
        {
          page: 1,
          perPage: FAVORITE_COUNTS_PER_PAGE,
          sort: 'name-asc',
        },
        { signal: productsController.signal }
      ),
      getFavoritePharmacies(
        {
          page: 1,
          perPage: FAVORITE_COUNTS_PER_PAGE,
          sort: 'name-asc',
        },
        { signal: pharmaciesController.signal }
      ),
    ]);

    if (
      productsResult.status === 'fulfilled' &&
      isCurrentFavoriteRequest({
        currentVersion: favoriteProductsRequestVersionRef.current,
        requestVersion: productsListVersion,
        aborted: productsController.signal.aborted,
      })
    ) {
      setFavoriteProductsCount(productsResult.value.total);
    }

    if (
      pharmaciesResult.status === 'fulfilled' &&
      isCurrentFavoriteRequest({
        currentVersion: favoritePharmaciesRequestVersionRef.current,
        requestVersion: pharmaciesListVersion,
        aborted: pharmaciesController.signal.aborted,
      })
    ) {
      setFavoritePharmaciesCount(pharmaciesResult.value.total);
    }

    if (favoriteProductsCountAbortRef.current === productsController) {
      favoriteProductsCountAbortRef.current = null;
    }

    if (favoritePharmaciesCountAbortRef.current === pharmaciesController) {
      favoritePharmaciesCountAbortRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!canUseAuthFeatures) return;

    void loadFavoriteCounts();
  }, [canUseAuthFeatures, loadFavoriteCounts]);

  useEffect(
    () => () => {
      favoriteProductsAbortRef.current?.abort();
      favoriteProductsCountAbortRef.current?.abort();
      favoritePharmaciesAbortRef.current?.abort();
      favoritePharmaciesCountAbortRef.current?.abort();
      favoriteProductsRequestVersionRef.current += 1;
      favoritePharmaciesRequestVersionRef.current += 1;
    },
    []
  );

  useEffect(() => {
    if (!canUseAuthFeatures) return;

    const controller = new AbortController();

    async function loadOrders() {
      try {
        setIsOrdersLoading(true);
        const response = await getOrders(ordersQueryParams, {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setOrders([...response.items]);
          setOrdersTotal(response.total);
          setOrdersTotalPages(response.totalPages);
          setOrdersEarliestCreatedAt(response.earliestCreatedAt);
        }
      } catch {
        if (!controller.signal.aborted) {
          setOrders([]);
          setOrdersTotal(0);
          setOrdersTotalPages(0);
          setOrdersEarliestCreatedAt(null);
        }
      } finally {
        if (!controller.signal.aborted) setIsOrdersLoading(false);
      }
    }

    void loadOrders();

    return () => {
      controller.abort();
    };
  }, [canUseAuthFeatures, ordersQueryParams]);

  useEffect(() => {
    if (!canUseAuthFeatures || activeTab !== 'sessions') return;

    const controller = new AbortController();

    async function loadSessions() {
      try {
        setIsSessionsLoading(true);
        setSessionsError('');
        const response = await getActiveSessions({
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setSessions([...response.sessions]);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSessionsError('Could not load active sessions.');
        }
      } finally {
        if (!controller.signal.aborted) setIsSessionsLoading(false);
      }
    }

    void loadSessions();
    return () => {
      controller.abort();
    };
  }, [activeTab, canUseAuthFeatures]);

  const handleTabChange = (nextTab: ProfileTab) => {
    setActiveTab(nextTab);

    if (!canUseAuthFeatures) return;

    if (nextTab === 'favorite-products' && favoriteProductsPage === 0) {
      void loadFavoriteProducts();
    }

    if (nextTab === 'favorite-pharmacies' && favoritePharmaciesPage === 0) {
      void loadFavoritePharmacies();
    }
  };

  const handleOrdersFiltersChange = (nextFilters: ClientOrdersFilterState) => {
    setOrdersFilters(nextFilters);
    setOrdersCurrentPage(1);
  };

  const handleOrdersRowsPerPageChange = (nextRowsPerPage: RowsPerPageValue) => {
    setOrdersRowsPerPage(nextRowsPerPage);
    setOrdersCurrentPage(1);
  };

  const resetOrdersFilters = () => {
    setOrdersFilters(DEFAULT_CLIENT_ORDERS_FILTERS);
    setOrdersCurrentPage(1);
  };

  //===================================================================

  const handleRevokeSession = async (sessionId: string) => {
    if (sessionMutationInFlightRef.current) return;
    sessionMutationInFlightRef.current = true;

    try {
      setSessionsError('');
      await revokeActiveSession(sessionId);
      setSessions((current) =>
        current.filter((session) => session.id !== sessionId)
      );
      toast.success('Session was revoked.');
    } catch {
      setSessionsError('Could not revoke the session.');
    } finally {
      sessionMutationInFlightRef.current = false;
    }
  };

  const handleLogoutAllSessions = async () => {
    if (!logoutAll || sessionMutationInFlightRef.current) return;
    sessionMutationInFlightRef.current = true;

    try {
      await logoutAll();
    } catch {
      toast.error(
        'This browser was signed out, but other device sessions could not be revoked.'
      );
    } finally {
      sessionMutationInFlightRef.current = false;
    }
  };

  const handleProfileChange = (
    field: keyof DataProfileFormValues,
    value: string
  ) => {
    setProfileTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }));

    setProfileDraft((current) => {
      const baseline = current?.baseline ?? serverProfileValues;
      const nextValues = {
        ...(current?.values ?? serverProfileValues),
        [field]: value,
      };

      return isDataProfileFormDirty(nextValues, baseline)
        ? { values: nextValues, baseline }
        : null;
    });
  };

  const handlePictureError = (message: string) => {
    toast.error(message);
  };

  const handlePictureChange = async (pictureUrl: string | null) => {
    if (!canUseAuthFeatures || profileMutationInFlightRef.current) return;
    profileMutationInFlightRef.current = true;

    const previousPictureDraft = pictureDraft;

    try {
      setIsPictureSaving(true);
      setPictureDraft(pictureUrl);

      const response = await updateCurrentUser({
        pictureUrl,
        expectedRevision: user.revision,
      });
      applyCurrentUser(response.user);
      setPictureDraft(undefined);
      toast.success(
        pictureUrl ? 'Profile photo was updated.' : 'Profile photo was removed.'
      );
    } catch (error) {
      toast.error(
        getUserFacingErrorMessage(error, {
          fallback: 'Could not update profile photo.',
        })
      );
      setPictureDraft(previousPictureDraft);
    } finally {
      profileMutationInFlightRef.current = false;
      setIsPictureSaving(false);
    }
  };

  const handleProfileSubmit = async () => {
    const nextErrors = validateDataProfileForm(profileValues);
    setProfileTouchedFields(markAllFieldsTouched(DATA_PROFILE_FORM_FIELDS));

    if (
      !canUseAuthFeatures ||
      hasValidationErrors(nextErrors) ||
      !profileFormIsDirty ||
      profileMutationInFlightRef.current
    ) {
      return;
    }

    profileMutationInFlightRef.current = true;

    try {
      setIsProfileSaving(true);

      const nextProfileValues = normalizeDataProfileUpdateValues(profileValues);

      const response = await updateCurrentUser({
        ...nextProfileValues,
        expectedRevision: user.revision,
      });
      applyCurrentUser(response.user);
      setProfileDraft(null);
      setProfileTouchedFields({});
      toast.success('Profile data was updated.');
    } catch (error) {
      toast.error(
        getUserFacingErrorMessage(error, {
          fallback: 'Could not update profile data.',
          backendCodeMessages: {
            AUTH_PHONE_CONFLICT:
              'This phone number is already used by another account.',
            AUTH_PROFILE_CONFLICT:
              'Your profile changed in another tab. Reload the latest data and try again.',
          },
        })
      );
    } finally {
      profileMutationInFlightRef.current = false;
      setIsProfileSaving(false);
    }
  };

  const handlePasswordChange = (
    field: keyof ChangePasswordFormValues,
    value: string
  ) => {
    setPasswordSubmitError('');
    setPasswordTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }));

    setPasswordValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSavePassword = async () => {
    const nextErrors = validateChangePasswordForm(passwordValues);
    setPasswordTouchedFields(markAllFieldsTouched(CHANGE_PASSWORD_FORM_FIELDS));

    if (
      !canUseAuthFeatures ||
      hasValidationErrors(nextErrors) ||
      !passwordFormIsDirty ||
      passwordMutationInFlightRef.current
    ) {
      return;
    }

    passwordMutationInFlightRef.current = true;

    try {
      setIsPasswordSaving(true);
      setPasswordSubmitError('');

      await updateCurrentUserPassword(passwordValues);
      invalidateSession('password_changed');
      setPasswordValues(CHANGE_PASSWORD_INITIAL_VALUES);
      setPasswordTouchedFields({});
      toast.success('Password changed. Sign in again.');
      window.location.assign(ROUTES.LOGIN);
    } catch (error) {
      const message = getClientPasswordChangeErrorMessage(
        getAuthErrorCode(error)
      );

      setPasswordSubmitError(message);
      toast.error(message);
    } finally {
      passwordMutationInFlightRef.current = false;
      setIsPasswordSaving(false);
    }
  };

  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="profile-title">
        <Container>
          <Breadcrumbs items={createBreadcrumbs(PROFILE_TITLE)} />

          <h1 className={css.title} id="profile-title">
            {PROFILE_TITLE}
          </h1>

          <p className={css.text}>
            View your account details, orders, favorites and profile photo.
          </p>

          <div className={css.profileShell}>
            <aside className={css.sidebar} aria-label="Profile summary">
              <PictureCard
                name={user.name}
                pictureUrl={picturePreview}
                isSaving={isPictureSaving}
                accept={PICTURE_ACCEPT}
                validateFile={(file) => buildPictureFileError(file) || null}
                validatePictureUrl={(pictureUrl) =>
                  buildPictureUrlError(pictureUrl) || null
                }
                onChange={handlePictureChange}
                onError={handlePictureError}
              />

              <div className={css.nameBlock}>
                <h2 className={css.name}>{user.name}</h2>
                <p className={css.email}>{user.email}</p>
              </div>

              <dl className={css.compactDetails}>
                <div>
                  <dt>Role</dt>
                  <dd>{USER_ROLE_LABELS[user.role]}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{USER_STATUS_PRESENTATION[user.status].label}</dd>
                </div>
              </dl>
            </aside>

            <div className={css.contentCard}>
              <Tabs
                items={tabs}
                activeValue={activeTab}
                ariaLabel="Profile sections"
                mobileVisibleCount={2}
                tabletVisibleCount={4}
                onChange={handleTabChange}
              />

              {activeTab === 'data' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section
                    className={`${css.panelSection} ${css.profileDataSection}`}
                    aria-labelledby="personal-data-title"
                  >
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="personal-data-title">
                        Personal data
                      </h2>
                      <p className={css.panelText}>
                        Keep your contact details ready for fast checkout.
                      </p>
                    </div>

                    <div className={css.formGrid}>
                      <NameInput
                        id="profile-name"
                        name="name"
                        value={profileValues.name}
                        error={profileErrors.name}
                        isTouched={Boolean(profileTouchedFields.name)}
                        maxLength={USER_NAME_MAX_LENGTH}
                        onChange={(event) =>
                          handleProfileChange('name', event.target.value)
                        }
                      />

                      <PhoneInput
                        id="profile-phone"
                        name="phone"
                        value={profileValues.phone}
                        error={profileErrors.phone}
                        isTouched={Boolean(profileTouchedFields.phone)}
                        maxLength={USER_PHONE_MAX_LENGTH}
                        onChange={(event) =>
                          handleProfileChange(
                            'phone',
                            normalizePhoneInput(event.target.value)
                          )
                        }
                      />

                      <AddressInput
                        id="profile-address"
                        name="address"
                        className={css.fieldWide}
                        value={profileValues.address}
                        error={profileErrors.address}
                        isTouched={Boolean(profileTouchedFields.address)}
                        required={false}
                        maxLength={USER_ADDRESS_MAX_LENGTH}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                          handleProfileChange('address', event.target.value)
                        }
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={
                        !profileFormIsValid ||
                        !profileFormIsDirty ||
                        isProfileSaving
                      }
                      onClick={() => void handleProfileSubmit()}
                    >
                      {isProfileSaving ? 'Saving...' : 'Save changes'}
                    </Button>
                  </section>

                  <section
                    className={css.panelSection}
                    aria-labelledby="password-title"
                  >
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="password-title">
                        Change password
                      </h2>
                      <p className={css.panelText}>
                        Keep your account more securely locked.
                      </p>
                    </div>

                    <div className={css.formGrid}>
                      <PasswordInput
                        id="current-password"
                        name="currentPassword"
                        label="Current password"
                        value={passwordValues.currentPassword}
                        autoComplete="current-password"
                        error={passwordErrors.currentPassword}
                        isTouched={Boolean(
                          passwordTouchedFields.currentPassword
                        )}
                        isVisible={isCurrentPasswordVisible}
                        maxLength={USER_PASSWORD_MAX_LENGTH}
                        onChange={(event) =>
                          handlePasswordChange(
                            'currentPassword',
                            event.target.value
                          )
                        }
                        onToggleVisibility={() =>
                          setIsCurrentPasswordVisible((isVisible) => !isVisible)
                        }
                      />

                      <PasswordInput
                        id="new-password"
                        name="newPassword"
                        label="New password"
                        value={passwordValues.newPassword}
                        autoComplete="new-password"
                        error={passwordErrors.newPassword}
                        isTouched={Boolean(passwordTouchedFields.newPassword)}
                        isVisible={isNewPasswordVisible}
                        maxLength={USER_PASSWORD_MAX_LENGTH}
                        onChange={(event) =>
                          handlePasswordChange(
                            'newPassword',
                            event.target.value
                          )
                        }
                        onToggleVisibility={() =>
                          setIsNewPasswordVisible((isVisible) => !isVisible)
                        }
                      />
                    </div>

                    {passwordSubmitError ? (
                      <p className={css.error} role="alert">
                        {passwordSubmitError}
                      </p>
                    ) : null}

                    <Button
                      type="button"
                      disabled={!passwordFormIsValid || isPasswordSaving}
                      iconLeft={<KeyRound size={18} aria-hidden="true" />}
                      onClick={() => void handleSavePassword()}
                    >
                      {isPasswordSaving ? 'Changing...' : 'Change password'}
                    </Button>
                  </section>
                </div>
              ) : null}

              {activeTab === 'sessions' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section
                    className={css.panelSection}
                    aria-labelledby="sessions-title"
                  >
                    <div className={css.sessionsHeader}>
                      <div className={css.panelHeader}>
                        <h2 className={css.panelTitle} id="sessions-title">
                          Active sessions and devices
                        </h2>
                        <p className={css.panelText}>
                          Review devices signed in to your account and revoke
                          sessions you no longer use.
                        </p>
                      </div>

                      {logoutAll ? (
                        <Button
                          className={css.sessionsSignOutButton}
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => void handleLogoutAllSessions()}
                        >
                          Sign out all devices
                        </Button>
                      ) : null}
                    </div>

                    {isSessionsLoading ? (
                      <LoadingSpinner label="Loading active sessions..." />
                    ) : sessionsError ? (
                      <p className={css.error} role="alert">
                        {sessionsError}
                      </p>
                    ) : (
                      <ul className={css.sessionsList}>
                        {sessions.map((session) => (
                          <li className={css.sessionCard} key={session.id}>
                            <MonitorSmartphone size={22} aria-hidden="true" />
                            <div className={css.sessionInfo}>
                              <strong>
                                {session.deviceName || 'Unknown device'}
                              </strong>
                              <span>{session.ip || 'IP unavailable'}</span>
                              <span>
                                Last active:{' '}
                                {formatShortDate(session.lastUsedAt) ?? '—'}
                              </span>
                            </div>
                            {session.isCurrent ? (
                              <span className={css.currentSession}>
                                Current session
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  void handleRevokeSession(session.id)
                                }
                              >
                                Revoke
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              ) : null}

              {activeTab === 'orders' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <div className={css.panelHeader}>
                    <h2 className={css.panelTitle}>My orders</h2>
                    <p className={css.panelText}>
                      Search by order number or pharmacy and narrow the list
                      with order filters.
                    </p>
                  </div>

                  <section
                    className={css.ordersFiltersCard}
                    aria-label="Order search and filters"
                  >
                    <div className={css.ordersSearchGrid}>
                      <SearchInput
                        id="profile-orders-number-search"
                        label="Order number search"
                        value={ordersFilters.orderNumber}
                        placeholder="Order number"
                        isActive={Boolean(ordersFilters.orderNumber)}
                        onChange={(orderNumber) =>
                          handleOrdersFiltersChange({
                            ...ordersFilters,
                            orderNumber,
                          })
                        }
                      />

                      <SearchInput
                        id="profile-orders-pharmacy-search"
                        label="Pharmacy name search"
                        value={ordersFilters.pharmacy}
                        placeholder="Pharmacy name"
                        isActive={Boolean(ordersFilters.pharmacy)}
                        onChange={(pharmacy) =>
                          handleOrdersFiltersChange({
                            ...ordersFilters,
                            pharmacy,
                          })
                        }
                      />

                      <div className={css.ordersSearchAction}>
                        <FiltersButton
                          activeCount={ordersActiveFiltersCount}
                          controlsId="profile-orders-filters-panel"
                          isExpanded={isOrdersFiltersOpen}
                          onClick={() => setIsOrdersFiltersOpen(true)}
                          className={css.ordersFilterButton}
                        />
                      </div>
                    </div>
                  </section>

                  <div
                    className={css.ordersTableSection}
                    id="profile-orders-table"
                  >
                    <div className={css.ordersToolbar}>
                      <div className={css.ordersRowsControl}>
                        <RowsPerPageSelect
                          id="profile-orders-rows-per-page"
                          value={ordersRowsPerPage}
                          onChange={handleOrdersRowsPerPageChange}
                        />
                      </div>

                      <div className={css.ordersCountLabelWrap}>
                        <CountLabel
                          shown={orders.length}
                          total={effectiveOrdersCount}
                          label="orders"
                        />
                      </div>
                    </div>

                    <DataTable
                      columns={orderColumns}
                      items={canUseAuthFeatures ? orders : []}
                      getItemKey={(order) => String(order.id)}
                      isLoading={isOrdersLoading}
                      minWidth={0}
                      labels={{
                        loading: 'Loading orders...',
                        empty: hasActiveOrdersFilters
                          ? 'No orders found for the selected search and filters. Adjust them or reset the filters.'
                          : 'Orders will appear here after checkout.',
                      }}
                    />

                    <PaginationView
                      currentPage={ordersCurrentPage}
                      totalPages={ordersTotalPages}
                      onPageChange={setOrdersCurrentPage}
                    />
                  </div>

                  {isOrdersFiltersOpen ? (
                    <FilterDrawer
                      id="profile-orders-filters-panel"
                      eyebrow="Orders"
                      hasActiveFilters={hasActiveOrdersFilters}
                      onClose={() => setIsOrdersFiltersOpen(false)}
                      onReset={() => {
                        resetOrdersFilters();
                        setIsOrdersFiltersOpen(false);
                      }}
                    >
                      <DateFilter
                        id="profile-orders-date-filter"
                        minDate={ordersEarliestCreatedAt ?? undefined}
                        disabled={!ordersEarliestCreatedAt}
                        label="Order date"
                        value={ordersFilters.date}
                        isActive={Boolean(
                          ordersFilters.date.from || ordersFilters.date.to
                        )}
                        applyOnSubmit
                        applyLabel="Apply"
                        onChange={(date) =>
                          handleOrdersFiltersChange({
                            ...ordersFilters,
                            date,
                          })
                        }
                      />

                      <SelectField
                        id="profile-orders-delivery-method"
                        label="Delivery method"
                        value={ordersFilters.deliveryMethod}
                        options={DELIVERY_METHOD_OPTIONS}
                        isActive={ordersFilters.deliveryMethod !== 'all'}
                        onChange={(deliveryMethod) =>
                          handleOrdersFiltersChange({
                            ...ordersFilters,
                            deliveryMethod,
                          })
                        }
                      />

                      <SelectField
                        id="profile-orders-payment-method"
                        label="Payment method"
                        value={ordersFilters.paymentMethod}
                        options={PAYMENT_METHOD_OPTIONS}
                        isActive={ordersFilters.paymentMethod !== 'all'}
                        onChange={(paymentMethod) =>
                          handleOrdersFiltersChange({
                            ...ordersFilters,
                            paymentMethod,
                          })
                        }
                      />

                      <SelectField
                        id="profile-orders-status"
                        label="Order status"
                        value={ordersFilters.status}
                        options={ORDER_STATUS_OPTIONS}
                        isActive={ordersFilters.status !== 'all'}
                        onChange={(status) =>
                          handleOrdersFiltersChange({
                            ...ordersFilters,
                            status,
                          })
                        }
                      />

                      <SelectField
                        id="profile-orders-created-by"
                        label="Created by"
                        value={ordersFilters.createdByType}
                        options={ORDER_CREATED_BY_OPTIONS}
                        isActive={ordersFilters.createdByType !== 'all'}
                        onChange={(createdByType) =>
                          handleOrdersFiltersChange({
                            ...ordersFilters,
                            createdByType,
                          })
                        }
                      />
                    </FilterDrawer>
                  ) : null}
                </div>
              ) : null}

              {activeTab === 'favorite-products' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <div className={css.favoritesHeader}>
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle}>Favorite products</h2>
                      <p className={css.panelText}>
                        Products you mark with a heart are collected here.
                      </p>
                    </div>

                    <CountLabel
                      shown={visibleFavoriteProducts.length}
                      total={effectiveFavoriteProductsCount}
                      label="items"
                    />
                  </div>

                  {favoriteProductsError ? (
                    <p className={css.error} role="alert">
                      {favoriteProductsError}
                    </p>
                  ) : null}

                  {isFavoriteProductsLoading ? (
                    <LoadingSpinner label="Loading favorite products..." />
                  ) : visibleFavoriteProducts.length > 0 ? (
                    <>
                      <div className={css.favoritesGrid}>
                        {visibleFavoriteProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            headingLevel={3}
                            onFavoriteChange={(
                              productId: string,
                              isFavoriteProduct: boolean
                            ) => {
                              if (isFavoriteProduct) return;

                              setFavoriteProducts((prev) => {
                                const nextProducts = prev.filter(
                                  (item) => item.id !== productId
                                );
                                setFavoriteProductsCount((count) =>
                                  Math.max((count ?? 1) - 1, 0)
                                );

                                return nextProducts;
                              });
                            }}
                          />
                        ))}
                      </div>

                      {favoriteProductsPage < favoriteProductsTotalPages &&
                      hiddenFavoriteProductsCount > 0 ? (
                        <Button
                          className={css.showMoreButton}
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            void loadFavoriteProducts(favoriteProductsPage + 1)
                          }
                        >
                          Show more products ({hiddenFavoriteProductsCount})
                        </Button>
                      ) : null}
                    </>
                  ) : (
                    <div className={css.emptyState}>
                      <span className={css.emptyIcon} aria-hidden="true">
                        <Heart size={30} />
                      </span>
                      <div className={css.emptyCopy}>
                        <h3 className={css.emptyTitle}>
                          No favorite products yet
                        </h3>
                        <p className={css.panelText}>
                          Tap the heart on a product card, and it will wait here
                          nicely — no shelf drama included.
                        </p>
                      </div>
                      <LinkButton href={ROUTES.PRODUCTS_CATALOG}>
                        Browse products
                      </LinkButton>
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === 'favorite-pharmacies' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <div className={css.favoritesHeader}>
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle}>Favorite pharmacies</h2>
                      <p className={css.panelText}>
                        Pharmacies you mark with a heart are saved here for
                        quick access.
                      </p>
                    </div>

                    <CountLabel
                      shown={visibleFavoritePharmacies.length}
                      total={effectiveFavoritePharmaciesCount}
                      label="pharmacies"
                    />
                  </div>

                  {favoritePharmaciesError ? (
                    <p className={css.error} role="alert">
                      {favoritePharmaciesError}
                    </p>
                  ) : null}

                  {isFavoritePharmaciesLoading ? (
                    <LoadingSpinner label="Loading favorite pharmacies..." />
                  ) : visibleFavoritePharmacies.length > 0 ? (
                    <>
                      <div className={css.favoritesGrid}>
                        {visibleFavoritePharmacies.map((pharmacy) => (
                          <PharmacyCard
                            key={pharmacy.id}
                            pharmacy={pharmacy}
                            headingLevel={3}
                            onFavoriteChange={(
                              pharmacyId: string,
                              isFavoritePharmacy: boolean
                            ) => {
                              if (isFavoritePharmacy) return;

                              setFavoritePharmacies((prev) => {
                                const nextPharmacies = prev.filter(
                                  (item) => item.id !== pharmacyId
                                );
                                setFavoritePharmaciesCount((count) =>
                                  Math.max((count ?? 1) - 1, 0)
                                );

                                return nextPharmacies;
                              });
                            }}
                          />
                        ))}
                      </div>

                      {favoritePharmaciesPage < favoritePharmaciesTotalPages &&
                      hiddenFavoritePharmaciesCount > 0 ? (
                        <Button
                          className={css.showMoreButton}
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            void loadFavoritePharmacies(
                              favoritePharmaciesPage + 1
                            )
                          }
                        >
                          Show more pharmacies ({hiddenFavoritePharmaciesCount})
                        </Button>
                      ) : null}
                    </>
                  ) : (
                    <div className={css.emptyState}>
                      <span className={css.emptyIcon} aria-hidden="true">
                        <Building2 size={30} />
                      </span>
                      <div className={css.emptyCopy}>
                        <h3 className={css.emptyTitle}>
                          No favorite pharmacies yet
                        </h3>
                        <p className={css.panelText}>
                          Mark a pharmacy with a heart, and it will stay here
                          for quick access — loyal as a tiny green assistant.
                        </p>
                      </div>
                      <LinkButton href={ROUTES.PHARMACIES}>
                        Browse pharmacies
                      </LinkButton>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

//===================================================================

function ProfilePageContent() {
  const { user } = useAuth();

  if (!user) {
    return <ProfileUnavailable />;
  }

  return <AuthenticatedProfilePageContent key={user.id} user={user} />;
}

//===================================================================

function ProfileUnavailable() {
  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="profile-title">
        <Container>
          <Breadcrumbs items={createBreadcrumbs(PROFILE_TITLE)} />

          <div className={css.emptyCard}>
            <h1 className={css.title} id="profile-title">
              Profile is not available
            </h1>

            <p className={css.text}>
              We could not load your profile data. Please log in again.
            </p>

            <LinkButton href={ROUTES.LOGIN}>Go to login</LinkButton>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default ProfilePageContent;
