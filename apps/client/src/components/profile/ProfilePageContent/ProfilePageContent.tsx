'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import Link from 'next/link';
import { Heart, KeyRound, Store } from 'lucide-react';

import {
  Button,
  ButtonLink,
  Container,
  LoadingSpinner,
  ProfilePhotoCard,
  Tabs,
} from '@e-pharmacy/ui/common';

import {
  AddressInput,
  NameInput,
  PasswordInput,
  PhoneInput,
} from '@e-pharmacy/ui/form-fields';

import { Breadcrumbs } from '@e-pharmacy/ui/layout';
import { ProductCard } from '@/components/medicines-catalog';
import { StoreCard } from '@/components/pharmacy-stores';
import { PROFILE_TITLE } from '@e-pharmacy/config/seo';
import { ROUTES } from '@e-pharmacy/config/routes';

import {
  formatCapitalizedLabel,
  formatPrice,
  formatShortDate,
} from '@e-pharmacy/utils/formatters';

import { buildCustomerOrderPath } from '@/lib/orders';
import { buildStorePath, createBreadcrumbs } from '@e-pharmacy/config/routes';

import {
  buildAddressError,
  buildNameError,
  buildPhoneError,
  sanitizeAddress,
  sanitizeName,
  sanitizePhone,
  USER_PASSWORD_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
  VALIDATION_MESSAGES,
} from '@e-pharmacy/validation';

import { useAuth } from '@/providers';

import {
  getOrders,
  getProducts,
  getStores,
  updateCurrentUser,
  updateCurrentUserPassword,
} from '@e-pharmacy/api-client/client';

import type {
  CustomerOrder,
  Product,
  Store as PharmacyStore,
} from '@e-pharmacy/types';

import css from './ProfilePageContent.module.css';

//===================================================================

type ProfileTab = 'data' | 'orders' | 'favorite-products' | 'favorite-stores';

type ProfileFormValues = {
  name: string;
  phone: string;
  address: string;
};

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
};

//===================================================================

const TABS: Array<{
  value: ProfileTab;
  label: string;
}> = [
  { value: 'data', label: 'My data' },
  { value: 'orders', label: 'My orders' },
  { value: 'favorite-products', label: 'Favorite products' },
  { value: 'favorite-stores', label: 'Favorite stores' },
];

const FAVORITES_PER_PAGE = 100;
const FAVORITES_VISIBLE_STEP = 16;
const ORDERS_VISIBLE_STEP = 15;

//===================================================================

function getPasswordError(value: string): string {
  if (!value) return '';

  if (value.length < USER_PASSWORD_MIN_LENGTH) {
    return VALIDATION_MESSAGES.limits.passwordMin;
  }

  if (value.length > USER_PASSWORD_MAX_LENGTH) {
    return VALIDATION_MESSAGES.limits.passwordMax;
  }

  return '';
}

//===================================================================

function getProfileErrors(values: ProfileFormValues) {
  const errors: Partial<Record<keyof ProfileFormValues, string>> = {};
  const name = values.name.trim();

  if (!name) {
    errors.name = 'Name is required';
  } else {
    const nameError = buildNameError(values.name, { trailingDot: true });
    if (nameError) errors.name = nameError;
  }

  const phoneError = buildPhoneError(values.phone, { trailingDot: true });
  const addressError = buildAddressError(values.address, { trailingDot: true });

  if (phoneError) errors.phone = phoneError;
  if (addressError) errors.address = addressError;

  return errors;
}

//===================================================================

async function getFavoriteProducts(): Promise<Product[]> {
  const firstPage = await getProducts({
    page: 1,
    perPage: FAVORITES_PER_PAGE,
    sort: 'name-asc',
  });
  const pages = [firstPage];

  if (firstPage.totalPages > 1) {
    const nextPages = await Promise.all(
      Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
        getProducts({
          page: index + 2,
          perPage: FAVORITES_PER_PAGE,
          sort: 'name-asc',
        })
      )
    );

    pages.push(...nextPages);
  }

  return pages.flatMap((page) =>
    page.items.filter((product) => Boolean(product.isFavorite))
  );
}

//===================================================================

async function getFavoriteStores(): Promise<PharmacyStore[]> {
  const firstPage = await getStores({
    page: 1,
    perPage: FAVORITES_PER_PAGE,
    sort: 'name-asc',
  });
  const pages = [firstPage];

  if (firstPage.totalPages > 1) {
    const nextPages = await Promise.all(
      Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
        getStores({
          page: index + 2,
          perPage: FAVORITES_PER_PAGE,
          sort: 'name-asc',
        })
      )
    );

    pages.push(...nextPages);
  }

  return pages.flatMap((page) =>
    page.items.filter((store) => Boolean(store.isFavorite))
  );
}

//===================================================================

function ProfilePageContent() {
  const { sessionMarker, user, refreshCurrentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('data');
  const [profileValues, setProfileValues] = useState<ProfileFormValues>({
    name: '',
    phone: '',
    address: '',
  });
  const [passwordValues, setPasswordValues] = useState<PasswordFormValues>({
    currentPassword: '',
    newPassword: '',
  });
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] =
    useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersVisibleCount, setOrdersVisibleCount] =
    useState(ORDERS_VISIBLE_STEP);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [favoriteStores, setFavoriteStores] = useState<PharmacyStore[]>([]);
  const [favoriteProductsError, setFavoriteProductsError] = useState('');
  const [favoriteStoresError, setFavoriteStoresError] = useState('');
  const [favoriteProductsCount, setFavoriteProductsCount] = useState<
    number | null
  >(null);
  const [favoriteStoresCount, setFavoriteStoresCount] = useState<number | null>(
    null
  );
  const [favoriteProductsVisibleCount, setFavoriteProductsVisibleCount] =
    useState(FAVORITES_VISIBLE_STEP);
  const [favoriteStoresVisibleCount, setFavoriteStoresVisibleCount] = useState(
    FAVORITES_VISIBLE_STEP
  );
  const [isFavoriteProductsLoading, setIsFavoriteProductsLoading] =
    useState(false);
  const [isFavoriteStoresLoading, setIsFavoriteStoresLoading] = useState(false);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [passwordSubmitError, setPasswordSubmitError] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const timeoutId = window.setTimeout(() => {
      setProfileValues({
        name: user.name ?? '',
        phone: user.phone ?? '',
        address: user.address ?? '',
      });
      setAvatarPreview(user.avatarUrl ?? null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [user]);

  const profileErrors = useMemo(
    () => getProfileErrors(profileValues),
    [profileValues]
  );
  const passwordErrors = useMemo(() => {
    const currentPasswordError =
      passwordValues.newPassword && !passwordValues.currentPassword
        ? 'Current password is required'
        : '';
    const newPasswordError = getPasswordError(passwordValues.newPassword);

    return {
      currentPassword: currentPasswordError,
      newPassword: newPasswordError,
    };
  }, [passwordValues]);

  const canSaveProfile = Object.keys(profileErrors).length === 0;
  const canSavePassword =
    passwordValues.currentPassword.trim().length > 0 &&
    passwordValues.newPassword.length > 0 &&
    !passwordErrors.currentPassword &&
    !passwordErrors.newPassword;

  const tabs = useMemo(
    () =>
      TABS.map((tab) => {
        if (tab.value === 'favorite-products') {
          return {
            ...tab,
            label:
              favoriteProductsCount === null
                ? tab.label
                : `${tab.label} (${favoriteProductsCount})`,
          };
        }

        if (tab.value === 'favorite-stores') {
          return {
            ...tab,
            label:
              favoriteStoresCount === null
                ? tab.label
                : `${tab.label} (${favoriteStoresCount})`,
          };
        }

        if (tab.value === 'orders') {
          return {
            ...tab,
            label: `${tab.label} (${orders.length})`,
          };
        }

        return tab;
      }),
    [favoriteProductsCount, favoriteStoresCount, orders.length]
  );

  const visibleOrders = useMemo(
    () => orders.slice(0, ordersVisibleCount),
    [orders, ordersVisibleCount]
  );
  const hiddenOrdersCount = Math.max(orders.length - visibleOrders.length, 0);

  const visibleFavoriteProducts = useMemo(
    () => favoriteProducts.slice(0, favoriteProductsVisibleCount),
    [favoriteProducts, favoriteProductsVisibleCount]
  );
  const visibleFavoriteStores = useMemo(
    () => favoriteStores.slice(0, favoriteStoresVisibleCount),
    [favoriteStores, favoriteStoresVisibleCount]
  );
  const hiddenFavoriteProductsCount = Math.max(
    favoriteProducts.length - visibleFavoriteProducts.length,
    0
  );
  const hiddenFavoriteStoresCount = Math.max(
    favoriteStores.length - visibleFavoriteStores.length,
    0
  );

  const loadFavoriteProducts = useCallback(async () => {
    try {
      setIsFavoriteProductsLoading(true);
      setFavoriteProductsError('');

      const products = await getFavoriteProducts();

      setFavoriteProducts(products);
      setFavoriteProductsCount(products.length);
    } catch {
      setFavoriteProductsError('Could not load favorite products.');
      setFavoriteProductsCount(0);
    } finally {
      setIsFavoriteProductsLoading(false);
    }
  }, []);

  const loadFavoriteStores = useCallback(async () => {
    try {
      setIsFavoriteStoresLoading(true);
      setFavoriteStoresError('');

      const stores = await getFavoriteStores();

      setFavoriteStores(stores);
      setFavoriteStoresCount(stores.length);
    } catch {
      setFavoriteStoresError('Could not load favorite stores.');
      setFavoriteStoresCount(0);
    } finally {
      setIsFavoriteStoresLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionMarker) return;

    const timeoutId = window.setTimeout(() => {
      void loadFavoriteProducts();
      void loadFavoriteStores();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadFavoriteProducts, loadFavoriteStores, sessionMarker]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setOrdersVisibleCount(ORDERS_VISIBLE_STEP);
      setFavoriteProductsVisibleCount(FAVORITES_VISIBLE_STEP);
      setFavoriteStoresVisibleCount(FAVORITES_VISIBLE_STEP);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;

    if (!sessionMarker) {
      const timeoutId = window.setTimeout(() => {
        if (isMounted) {
          setOrders([]);
        }
      }, 0);

      return () => {
        isMounted = false;
        window.clearTimeout(timeoutId);
      };
    }

    async function loadOrders() {
      try {
        setIsOrdersLoading(true);
        const response = await getOrders();

        if (!isMounted) return;

        setOrders(response.items);
      } catch {
        if (!isMounted) return;

        setOrders([]);
      } finally {
        if (!isMounted) return;

        setIsOrdersLoading(false);
      }
    }

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, [sessionMarker]);

  if (!user) {
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

              <ButtonLink href={ROUTES.LOGIN}>Go to login</ButtonLink>
            </div>
          </Container>
        </section>
      </main>
    );
  }

  const handleProfileChange = (
    field: keyof ProfileFormValues,
    value: string
  ) => {
    setFeedback('');
    setError('');

    setProfileValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarError = (message: string) => {
    setFeedback('');
    setError(message);
  };

  const handleAvatarChange = async (avatarUrl: string | null) => {
    if (!sessionMarker) return;

    const previousAvatarUrl = avatarPreview;

    try {
      setIsAvatarSaving(true);
      setFeedback('');
      setError('');
      setAvatarPreview(avatarUrl);

      await updateCurrentUser({ avatarUrl });
      await refreshCurrentUser();
      setFeedback(
        avatarUrl ? 'Profile photo was updated.' : 'Profile photo was removed.'
      );
    } catch {
      setError('Could not update profile photo.');
      setAvatarPreview(previousAvatarUrl);
    } finally {
      setIsAvatarSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!sessionMarker || !canSaveProfile) return;

    try {
      setIsProfileSaving(true);
      setFeedback('');
      setError('');

      await updateCurrentUser({
        name: profileValues.name.trim(),
        phone: profileValues.phone.trim(),
        address: profileValues.address.trim(),
      });
      await refreshCurrentUser();
      setFeedback('Profile data was updated.');
    } catch {
      setError('Could not update profile data.');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordChange = (
    field: keyof PasswordFormValues,
    value: string
  ) => {
    setFeedback('');
    setPasswordSubmitError('');
    setPasswordValues((prev) => ({
      ...prev,
      [field]: value.slice(0, USER_PASSWORD_MAX_LENGTH),
    }));
  };

  const handleSavePassword = async () => {
    if (!sessionMarker || !canSavePassword) return;

    try {
      setIsPasswordSaving(true);
      setFeedback('');
      setPasswordSubmitError('');

      await updateCurrentUserPassword(passwordValues);
      setPasswordValues({ currentPassword: '', newPassword: '' });
      setFeedback('Password was changed.');
    } catch {
      setPasswordSubmitError(
        'Could not change password. Check the current password and try again.'
      );
    } finally {
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
              <ProfilePhotoCard
                name={user.name}
                avatarUrl={avatarPreview}
                isSaving={isAvatarSaving}
                onChange={handleAvatarChange}
                onError={handleAvatarError}
              />

              <div className={css.nameBlock}>
                <h2 className={css.name}>{user.name}</h2>
                <p className={css.email}>{user.email}</p>
              </div>

              <dl className={css.compactDetails}>
                <div>
                  <dt>Role</dt>
                  <dd>{formatCapitalizedLabel(user.role)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{formatCapitalizedLabel(user.status)}</dd>
                </div>
              </dl>
            </aside>

            <div className={css.contentCard}>
              <Tabs
                items={tabs}
                activeValue={activeTab}
                ariaLabel="Profile sections"
                mobileVisibleCount={2}
                onChange={setActiveTab}
              />

              {feedback ? <p className={css.feedback}>{feedback}</p> : null}
              {error ? (
                <p className={css.error} role="alert">
                  {error}
                </p>
              ) : null}

              {activeTab === 'data' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section
                    className={css.panelSection}
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
                        isTouched
                        onChange={(event) =>
                          handleProfileChange(
                            'name',
                            sanitizeName(event.target.value)
                          )
                        }
                      />

                      <PhoneInput
                        id="profile-phone"
                        name="phone"
                        value={profileValues.phone}
                        error={profileErrors.phone}
                        isTouched
                        required={false}
                        onChange={(event) =>
                          handleProfileChange(
                            'phone',
                            sanitizePhone(event.target.value)
                          )
                        }
                      />

                      <AddressInput
                        id="profile-address"
                        name="address"
                        className={css.fieldWide}
                        value={profileValues.address}
                        error={profileErrors.address}
                        isTouched
                        required={false}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                          handleProfileChange(
                            'address',
                            sanitizeAddress(event.target.value)
                          )
                        }
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={!canSaveProfile || isProfileSaving}
                      onClick={() => void handleSaveProfile()}
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
                        isTouched
                        isVisible={isCurrentPasswordVisible}
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
                        isTouched
                        isVisible={isNewPasswordVisible}
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
                      disabled={!canSavePassword || isPasswordSaving}
                      onClick={() => void handleSavePassword()}
                    >
                      <KeyRound size={18} aria-hidden="true" />
                      {isPasswordSaving ? 'Changing...' : 'Change password'}
                    </Button>
                  </section>
                </div>
              ) : null}

              {activeTab === 'orders' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <div className={css.ordersHeader}>
                    <h2 className={css.panelTitle}>My orders</h2>
                    <span className={css.countBadge}>
                      {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                    </span>
                  </div>

                  <div className={css.tableWrap}>
                    <table className={css.ordersTable}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Order number</th>
                          <th>Pharmacy</th>
                          <th>Order amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isOrdersLoading ? (
                          <tr>
                            <td colSpan={5}>Loading orders...</td>
                          </tr>
                        ) : orders.length > 0 ? (
                          visibleOrders.map((order) => (
                            <tr key={order.id}>
                              <td>{formatShortDate(order.createdAt)}</td>
                              <td>
                                <Link
                                  className={css.orderLink}
                                  href={buildCustomerOrderPath(order)}
                                >
                                  {order.orderNumber}
                                </Link>
                              </td>
                              <td>
                                <Link
                                  className={css.storeLink}
                                  href={buildStorePath(
                                    order.storeName,
                                    order.storeId
                                  )}
                                >
                                  {order.storeName}
                                </Link>
                              </td>
                              <td>{formatPrice(order.totalPrice)}</td>
                              <td>
                                <span className={css.statusBadge}>
                                  {formatCapitalizedLabel(order.status)}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5}>
                              Orders will appear here after checkout.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {hiddenOrdersCount > 0 ? (
                    <Button
                      className={css.showMoreButton}
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        setOrdersVisibleCount(
                          (prev) => prev + ORDERS_VISIBLE_STEP
                        )
                      }
                    >
                      Show more orders ({hiddenOrdersCount})
                    </Button>
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

                    <span className={css.countBadge}>
                      {favoriteProductsCount ?? favoriteProducts.length}{' '}
                      {(favoriteProductsCount ?? favoriteProducts.length) === 1
                        ? 'item'
                        : 'items'}
                    </span>
                  </div>

                  {favoriteProductsError ? (
                    <p className={css.error} role="alert">
                      {favoriteProductsError}
                    </p>
                  ) : null}

                  {isFavoriteProductsLoading ? (
                    <LoadingSpinner label="Loading favorite products..." />
                  ) : favoriteProducts.length > 0 ? (
                    <>
                      <div className={css.favoritesGrid}>
                        {visibleFavoriteProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            skipFavoriteRefresh
                            onFavoriteChange={(
                              productId,
                              isFavoriteProduct
                            ) => {
                              if (isFavoriteProduct) return;

                              setFavoriteProducts((prev) => {
                                const nextProducts = prev.filter(
                                  (item) => item.id !== productId
                                );
                                setFavoriteProductsCount(nextProducts.length);

                                return nextProducts;
                              });
                            }}
                          />
                        ))}
                      </div>

                      {hiddenFavoriteProductsCount > 0 ? (
                        <Button
                          className={css.showMoreButton}
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setFavoriteProductsVisibleCount(
                              (prev) => prev + FAVORITES_VISIBLE_STEP
                            )
                          }
                        >
                          Show more medicines ({hiddenFavoriteProductsCount})
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
                          Tap the heart on a medicine card, and it will wait
                          here nicely — no shelf drama included.
                        </p>
                      </div>
                      <ButtonLink href={ROUTES.MEDICINES_CATALOG}>
                        Browse medicines
                      </ButtonLink>
                    </div>
                  )}
                </div>
              ) : null}

              {activeTab === 'favorite-stores' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <div className={css.favoritesHeader}>
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle}>Favorite stores</h2>
                      <p className={css.panelText}>
                        Pharmacies you mark with a heart are saved here for
                        quick access.
                      </p>
                    </div>

                    <span className={css.countBadge}>
                      {favoriteStoresCount ?? favoriteStores.length}{' '}
                      {(favoriteStoresCount ?? favoriteStores.length) === 1
                        ? 'store'
                        : 'stores'}
                    </span>
                  </div>

                  {favoriteStoresError ? (
                    <p className={css.error} role="alert">
                      {favoriteStoresError}
                    </p>
                  ) : null}

                  {isFavoriteStoresLoading ? (
                    <LoadingSpinner label="Loading favorite stores..." />
                  ) : favoriteStores.length > 0 ? (
                    <>
                      <div className={css.favoritesGrid}>
                        {visibleFavoriteStores.map((store) => (
                          <StoreCard
                            key={store.id}
                            store={store}
                            skipFavoriteRefresh
                            onFavoriteChange={(storeId, isFavoriteStore) => {
                              if (isFavoriteStore) return;

                              setFavoriteStores((prev) => {
                                const nextStores = prev.filter(
                                  (item) => item.id !== storeId
                                );
                                setFavoriteStoresCount(nextStores.length);

                                return nextStores;
                              });
                            }}
                          />
                        ))}
                      </div>

                      {hiddenFavoriteStoresCount > 0 ? (
                        <Button
                          className={css.showMoreButton}
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setFavoriteStoresVisibleCount(
                              (prev) => prev + FAVORITES_VISIBLE_STEP
                            )
                          }
                        >
                          Show more pharmacies ({hiddenFavoriteStoresCount})
                        </Button>
                      ) : null}
                    </>
                  ) : (
                    <div className={css.emptyState}>
                      <span className={css.emptyIcon} aria-hidden="true">
                        <Store size={30} />
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
                      <ButtonLink href={ROUTES.STORES}>
                        Browse pharmacies
                      </ButtonLink>
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

export default ProfilePageContent;
