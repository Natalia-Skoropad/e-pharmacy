'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import Link from 'next/link';
import { Building2, Heart, KeyRound } from 'lucide-react';

import {
  Button,
  ButtonLink,
  Container,
  CountLabel,
  LoadingSpinner,
  PictureCard,
  Tabs,
} from '@e-pharmacy/ui/common';

import {
  AddressInput,
  NameInput,
  PasswordInput,
  PhoneInput,
} from '@e-pharmacy/ui/form-fields';

import { Breadcrumbs } from '@e-pharmacy/ui/layout';
import { ProductCard } from '@/components/product-catalog';
import { PharmacyCard } from '@/components/pharmacies';
import { PROFILE_TITLE } from '@e-pharmacy/config/seo';
import { ROUTES } from '@e-pharmacy/config/routes';

import {
  formatCapitalizedLabel,
  formatPrice,
  formatShortDate,
} from '@e-pharmacy/utils/formatters';

import { buildOrderPath } from '@/lib/orders';

import {
  buildPharmacyPath,
  createBreadcrumbs,
} from '@e-pharmacy/config/routes';

import {
  CHANGE_PASSWORD_FORM_FIELDS,
  CHANGE_PASSWORD_INITIAL_VALUES,
  DATA_PROFILE_FORM_FIELDS,
  DATA_PROFILE_INITIAL_VALUES,
  hasValidationErrors,
  isChangePasswordFormDirty,
  isChangePasswordFormValid,
  isDataProfileFormDirty,
  isDataProfileFormValid,
  markAllFieldsTouched,
  normalizeDataProfileValues,
  sanitizeAddress,
  sanitizeName,
  sanitizePassword,
  sanitizePhone,
  validateChangePasswordForm,
  validateDataProfileForm,
  type ChangePasswordFormValues,
  type ChangePasswordTouchedFields,
  type DataProfileFormValues,
  type DataProfileTouchedFields,
} from '@e-pharmacy/validation';

import { useAuth } from '@e-pharmacy/auth/core';

import {
  getOrders,
  getProducts,
  getPharmacies,
  updateCurrentUser,
  updateCurrentUserPassword,
} from '@e-pharmacy/api-client/client';

import type { Order, Product, Pharmacy } from '@e-pharmacy/types';

import css from './ProfilePageContent.module.css';

//===================================================================

type ProfileTab =
  | 'data'
  | 'orders'
  | 'favorite-products'
  | 'favorite-pharmacies';

const TABS: Array<{
  value: ProfileTab;
  label: string;
}> = [
  { value: 'data', label: 'My data' },
  { value: 'orders', label: 'My orders' },
  { value: 'favorite-products', label: 'Favorite products' },
  { value: 'favorite-pharmacies', label: 'Favorite pharmacies' },
];

const FAVORITES_PER_PAGE = 100;
const FAVORITES_VISIBLE_STEP = 16;
const ORDERS_VISIBLE_STEP = 15;

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

async function getFavoritePharmacies(): Promise<Pharmacy[]> {
  const firstPage = await getPharmacies({
    page: 1,
    perPage: FAVORITES_PER_PAGE,
    sort: 'name-asc',
  });
  const pages = [firstPage];

  if (firstPage.totalPages > 1) {
    const nextPages = await Promise.all(
      Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
        getPharmacies({
          page: index + 2,
          perPage: FAVORITES_PER_PAGE,
          sort: 'name-asc',
        })
      )
    );

    pages.push(...nextPages);
  }

  return pages.flatMap((page) =>
    page.items.filter((pharmacy) => Boolean(pharmacy.isFavorite))
  );
}

//===================================================================

function ProfilePageContent() {
  const { isAuthenticated, isAuthReady, user, refreshCurrentUser } = useAuth();
  const canUseAuthFeatures = isAuthReady && isAuthenticated;
  const [activeTab, setActiveTab] = useState<ProfileTab>('data');

  const [profileValues, setProfileValues] = useState<DataProfileFormValues>(
    DATA_PROFILE_INITIAL_VALUES
  );

  const [initialProfileValues, setInitialProfileValues] =
    useState<DataProfileFormValues>(DATA_PROFILE_INITIAL_VALUES);

  const [profileTouchedFields, setProfileTouchedFields] =
    useState<DataProfileTouchedFields>({});

  const [passwordValues, setPasswordValues] =
    useState<ChangePasswordFormValues>(CHANGE_PASSWORD_INITIAL_VALUES);

  const [passwordTouchedFields, setPasswordTouchedFields] =
    useState<ChangePasswordTouchedFields>({});

  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] =
    useState(false);

  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  const [ordersVisibleCount, setOrdersVisibleCount] =
    useState(ORDERS_VISIBLE_STEP);

  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [favoritePharmacies, setFavoritePharmacies] = useState<Pharmacy[]>([]);
  const [favoriteProductsError, setFavoriteProductsError] = useState('');
  const [favoritePharmaciesError, setFavoritePharmaciesError] = useState('');

  const [favoriteProductsCount, setFavoriteProductsCount] = useState<
    number | null
  >(null);

  const [favoritePharmaciesCount, setFavoritePharmaciesCount] = useState<
    number | null
  >(null);

  const [favoriteProductsVisibleCount, setFavoriteProductsVisibleCount] =
    useState(FAVORITES_VISIBLE_STEP);

  const [favoritePharmaciesVisibleCount, setFavoritePharmaciesVisibleCount] =
    useState(FAVORITES_VISIBLE_STEP);

  const [isFavoriteProductsLoading, setIsFavoriteProductsLoading] =
    useState(false);

  const [isFavoritePharmaciesLoading, setIsFavoritePharmaciesLoading] =
    useState(false);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [passwordSubmitError, setPasswordSubmitError] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isPictureSaving, setIsPictureSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const timeoutId = window.setTimeout(() => {
      const nextProfileValues = {
        name: user.name ?? '',
        phone: user.phone ?? '',
        address: user.address ?? '',
      };

      setProfileValues(nextProfileValues);
      setInitialProfileValues(nextProfileValues);
      setProfileTouchedFields({});
      setPicturePreview(user.pictureUrl ?? null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [user]);

  const profileErrors = useMemo(
    () => validateDataProfileForm(profileValues),
    [profileValues]
  );

  const passwordErrors = useMemo(
    () => validateChangePasswordForm(passwordValues),
    [passwordValues]
  );

  const profileFormIsValid = isDataProfileFormValid(profileValues);

  const profileFormIsDirty = isDataProfileFormDirty(
    profileValues,
    initialProfileValues
  );

  const passwordFormIsDirty = isChangePasswordFormDirty(passwordValues);
  const passwordFormIsValid = isChangePasswordFormValid(passwordValues);

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

        if (tab.value === 'favorite-pharmacies') {
          return {
            ...tab,
            label:
              favoritePharmaciesCount === null
                ? tab.label
                : `${tab.label} (${favoritePharmaciesCount})`,
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
    [favoriteProductsCount, favoritePharmaciesCount, orders.length]
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

  const visibleFavoritePharmacies = useMemo(
    () => favoritePharmacies.slice(0, favoritePharmaciesVisibleCount),
    [favoritePharmacies, favoritePharmaciesVisibleCount]
  );

  const hiddenFavoriteProductsCount = Math.max(
    favoriteProducts.length - visibleFavoriteProducts.length,
    0
  );

  const hiddenFavoritePharmaciesCount = Math.max(
    favoritePharmacies.length - visibleFavoritePharmacies.length,
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

  const loadFavoritePharmacies = useCallback(async () => {
    try {
      setIsFavoritePharmaciesLoading(true);
      setFavoritePharmaciesError('');

      const pharmacies = await getFavoritePharmacies();

      setFavoritePharmacies(pharmacies);
      setFavoritePharmaciesCount(pharmacies.length);
    } catch {
      setFavoritePharmaciesError('Could not load favorite pharmacies.');
      setFavoritePharmaciesCount(0);
    } finally {
      setIsFavoritePharmaciesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canUseAuthFeatures) return;

    const timeoutId = window.setTimeout(() => {
      void loadFavoriteProducts();
      void loadFavoritePharmacies();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [canUseAuthFeatures, loadFavoriteProducts, loadFavoritePharmacies]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setOrdersVisibleCount(ORDERS_VISIBLE_STEP);
      setFavoriteProductsVisibleCount(FAVORITES_VISIBLE_STEP);
      setFavoritePharmaciesVisibleCount(FAVORITES_VISIBLE_STEP);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;

    if (!canUseAuthFeatures) {
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
  }, [canUseAuthFeatures]);

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
    field: keyof DataProfileFormValues,
    value: string
  ) => {
    setFeedback('');
    setError('');
    setProfileTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }));

    setProfileValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePictureError = (message: string) => {
    setFeedback('');
    setError(message);
  };

  const handlePictureChange = async (pictureUrl: string | null) => {
    if (!canUseAuthFeatures) return;

    const previousPictureUrl = picturePreview;

    try {
      setIsPictureSaving(true);
      setFeedback('');
      setError('');
      setPicturePreview(pictureUrl);

      await updateCurrentUser({ pictureUrl: pictureUrl });
      await refreshCurrentUser();
      setFeedback(
        pictureUrl ? 'Profile photo was updated.' : 'Profile photo was removed.'
      );
    } catch {
      setError('Could not update profile photo.');
      setPicturePreview(previousPictureUrl);
    } finally {
      setIsPictureSaving(false);
    }
  };

  const handleProfileSubmit = async () => {
    const nextErrors = validateDataProfileForm(profileValues);
    setProfileTouchedFields(markAllFieldsTouched(DATA_PROFILE_FORM_FIELDS));

    if (
      !canUseAuthFeatures ||
      hasValidationErrors(nextErrors) ||
      !profileFormIsDirty
    ) {
      return;
    }

    try {
      setIsProfileSaving(true);
      setFeedback('');
      setError('');

      const nextProfileValues = normalizeDataProfileValues(profileValues);

      await updateCurrentUser(nextProfileValues);
      await refreshCurrentUser();
      setInitialProfileValues(nextProfileValues);
      setProfileTouchedFields({});
      setFeedback('Profile data was updated.');
    } catch {
      setError('Could not update profile data.');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordChange = (
    field: keyof ChangePasswordFormValues,
    value: string
  ) => {
    setFeedback('');
    setPasswordSubmitError('');
    setPasswordTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }));

    setPasswordValues((prev) => ({
      ...prev,
      [field]: field === 'newPassword' ? sanitizePassword(value) : value,
    }));
  };

  const handleSavePassword = async () => {
    const nextErrors = validateChangePasswordForm(passwordValues);
    setPasswordTouchedFields(markAllFieldsTouched(CHANGE_PASSWORD_FORM_FIELDS));

    if (
      !canUseAuthFeatures ||
      hasValidationErrors(nextErrors) ||
      !passwordFormIsDirty
    ) {
      return;
    }

    try {
      setIsPasswordSaving(true);
      setFeedback('');
      setPasswordSubmitError('');

      await updateCurrentUserPassword(passwordValues);
      setPasswordValues(CHANGE_PASSWORD_INITIAL_VALUES);
      setPasswordTouchedFields({});
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
              <PictureCard
                name={user.name}
                pictureUrl={picturePreview}
                isSaving={isPictureSaving}
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
                        isTouched={Boolean(profileTouchedFields.name)}
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
                        isTouched={Boolean(profileTouchedFields.phone)}
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
                        isTouched={Boolean(profileTouchedFields.address)}
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
                    <CountLabel
                      shown={visibleOrders.length}
                      total={orders.length}
                      label="orders"
                    />
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
                                  href={buildOrderPath(order)}
                                >
                                  {order.orderNumber}
                                </Link>
                              </td>
                              <td>
                                <Link
                                  className={css.pharmacyLink}
                                  href={buildPharmacyPath(
                                    order.pharmacyName,
                                    order.pharmacyId
                                  )}
                                >
                                  {order.pharmacyName}
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

                    <CountLabel
                      shown={visibleFavoriteProducts.length}
                      total={favoriteProductsCount ?? favoriteProducts.length}
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
                      <ButtonLink href={ROUTES.PRODUCTS_CATALOG}>
                        Browse products
                      </ButtonLink>
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
                      total={
                        favoritePharmaciesCount ?? favoritePharmacies.length
                      }
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
                  ) : favoritePharmacies.length > 0 ? (
                    <>
                      <div className={css.favoritesGrid}>
                        {visibleFavoritePharmacies.map((pharmacy) => (
                          <PharmacyCard
                            key={pharmacy.id}
                            pharmacy={pharmacy}
                            skipFavoriteRefresh
                            onFavoriteChange={(
                              pharmacyId,
                              isFavoritePharmacy
                            ) => {
                              if (isFavoritePharmacy) return;

                              setFavoritePharmacies((prev) => {
                                const nextPharmacies = prev.filter(
                                  (item) => item.id !== pharmacyId
                                );
                                setFavoritePharmaciesCount(
                                  nextPharmacies.length
                                );

                                return nextPharmacies;
                              });
                            }}
                          />
                        ))}
                      </div>

                      {hiddenFavoritePharmaciesCount > 0 ? (
                        <Button
                          className={css.showMoreButton}
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setFavoritePharmaciesVisibleCount(
                              (prev) => prev + FAVORITES_VISIBLE_STEP
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
                      <ButtonLink href={ROUTES.PHARMACIES}>
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
