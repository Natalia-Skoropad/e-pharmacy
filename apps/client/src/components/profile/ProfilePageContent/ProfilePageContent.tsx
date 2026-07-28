'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Building2, Heart, KeyRound, MonitorSmartphone } from 'lucide-react';

import { ORDER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import {
  USER_ROLE_LABELS,
  USER_STATUS_PRESENTATION,
} from '@e-pharmacy/config/presentation';

import {
  Button,
  LoadingSpinner,
  TextActionButton,
} from '@e-pharmacy/ui/primitives';

import { LinkButton } from '@e-pharmacy/ui/navigation';

import {
  CountLabel,
  DataTable,
  type DataTableColumn,
} from '@e-pharmacy/ui/data-display';

import { PictureCard } from '@e-pharmacy/ui/media';
import { Tabs } from '@e-pharmacy/ui/navigation';

import {
  AddressInput,
  NameInput,
  PasswordInput,
  PhoneInput,
} from '@e-pharmacy/ui/forms';

import { useAuth } from '@e-pharmacy/auth/react';
import { useToast } from '@e-pharmacy/ui/feedback';
import { Container } from '@e-pharmacy/ui/layout';
import { Breadcrumbs } from '@e-pharmacy/ui/navigation';
import { formatMoney } from '@e-pharmacy/utils/money';
import { formatShortDate } from '@e-pharmacy/utils/date';

import {
  CHANGE_PASSWORD_FORM_FIELDS,
  CHANGE_PASSWORD_INITIAL_VALUES,
  USER_ADDRESS_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  DATA_PROFILE_FORM_FIELDS,
  DATA_PROFILE_INITIAL_VALUES,
  hasValidationErrors,
  isChangePasswordFormDirty,
  isChangePasswordFormValid,
  isDataProfileFormDirty,
  isDataProfileFormValid,
  markAllFieldsTouched,
  normalizeDataProfileValues,
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

import type { ActiveSession } from '@e-pharmacy/types/auth';
import type { ClientOrder } from '@e-pharmacy/types/orders';
import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';
import type { ProductDetails } from '@e-pharmacy/types/products';

import { PROFILE_TITLE } from '@/lib/seo';

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
const ORDERS_VISIBLE_STEP = 15;

//===================================================================

function ProfilePageContent() {
  const {
    canRenderAuthenticatedContent,
    user,
    reloadCurrentUser,
    invalidateSession,
  } = useAuth();

  const toast = useToast();
  const canUseAuthFeatures = canRenderAuthenticatedContent;
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
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState('');

  const [ordersVisibleCount, setOrdersVisibleCount] =
    useState(ORDERS_VISIBLE_STEP);

  const [favoriteProducts, setFavoriteProducts] = useState<ProductDetails[]>(
    []
  );

  const [favoritePharmacies, setFavoritePharmacies] = useState<
    PublicPharmacy[]
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
            label: `${tab.label} (${favoriteProductsCount})`,
          };
        }

        if (tab.value === 'favorite-pharmacies') {
          return {
            ...tab,
            label: `${tab.label} (${favoritePharmaciesCount})`,
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

  const orderColumns = useMemo<Array<DataTableColumn<ClientOrder>>>(
    () => [
      {
        key: 'date',
        title: 'Date',
        render: (order) => formatShortDate(order.createdAt) ?? '—',
      },
      {
        key: 'orderNumber',
        title: 'Order number',
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
        key: 'pharmacy',
        title: 'Pharmacy',
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
        key: 'amount',
        title: 'Order amount',
        render: (order) => formatMoney(order.totalPrice) ?? '—',
      },
      {
        key: 'status',
        title: 'Status',
        render: (order) => (
          <StatusBadge {...ORDER_STATUS_PRESENTATION[order.status]} />
        ),
      },
    ],
    []
  );

  const visibleFavoriteProducts = favoriteProducts;
  const visibleFavoritePharmacies = favoritePharmacies;
  const hiddenFavoriteProductsCount = Math.max(
    favoriteProductsCount - favoriteProducts.length,
    0
  );
  const hiddenFavoritePharmaciesCount = Math.max(
    favoritePharmaciesCount - favoritePharmacies.length,
    0
  );

  const loadFavoriteProducts = useCallback(async (page = 1) => {
    try {
      setIsFavoriteProductsLoading(true);
      setFavoriteProductsError('');
      const response = await getFavoriteProducts({
        page,
        perPage: FAVORITES_PER_PAGE,
        sort: 'name-asc',
      });
      setFavoriteProducts((current) =>
        page === 1 ? [...response.items] : [...current, ...response.items]
      );
      setFavoriteProductsCount(response.total);
      setFavoriteProductsPage(response.page);
      setFavoriteProductsTotalPages(response.totalPages);
    } catch {
      setFavoriteProductsError('Could not load favorite products.');
      if (page === 1) setFavoriteProductsCount(0);
    } finally {
      setIsFavoriteProductsLoading(false);
    }
  }, []);

  const loadFavoritePharmacies = useCallback(async (page = 1) => {
    try {
      setIsFavoritePharmaciesLoading(true);
      setFavoritePharmaciesError('');
      const response = await getFavoritePharmacies({
        page,
        perPage: FAVORITES_PER_PAGE,
        sort: 'name-asc',
      });
      setFavoritePharmacies((current) =>
        page === 1 ? [...response.items] : [...current, ...response.items]
      );
      setFavoritePharmaciesCount(response.total);
      setFavoritePharmaciesPage(response.page);
      setFavoritePharmaciesTotalPages(response.totalPages);
    } catch {
      setFavoritePharmaciesError('Could not load favorite pharmacies.');
      if (page === 1) setFavoritePharmaciesCount(0);
    } finally {
      setIsFavoritePharmaciesLoading(false);
    }
  }, []);

  const loadFavoriteCounts = useCallback(async () => {
    const [productsResult, pharmaciesResult] = await Promise.allSettled([
      getFavoriteProducts({
        page: 1,
        perPage: FAVORITE_COUNTS_PER_PAGE,
        sort: 'name-asc',
      }),
      getFavoritePharmacies({
        page: 1,
        perPage: FAVORITE_COUNTS_PER_PAGE,
        sort: 'name-asc',
      }),
    ]);

    if (productsResult.status === 'fulfilled') {
      setFavoriteProductsCount(productsResult.value.total);
    }

    if (pharmaciesResult.status === 'fulfilled') {
      setFavoritePharmaciesCount(pharmaciesResult.value.total);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!canUseAuthFeatures) {
        setFavoriteProductsCount(0);
        setFavoritePharmaciesCount(0);
        return;
      }

      void loadFavoriteCounts();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [canUseAuthFeatures, loadFavoriteCounts]);

  useEffect(() => {
    if (!canUseAuthFeatures) return;

    const shouldLoadFavoriteProducts =
      activeTab === 'favorite-products' && favoriteProductsPage === 0;

    const shouldLoadFavoritePharmacies =
      activeTab === 'favorite-pharmacies' && favoritePharmaciesPage === 0;

    if (!shouldLoadFavoriteProducts && !shouldLoadFavoritePharmacies) return;

    const timeoutId = window.setTimeout(() => {
      if (shouldLoadFavoriteProducts) {
        void loadFavoriteProducts();
      }

      if (shouldLoadFavoritePharmacies) {
        void loadFavoritePharmacies();
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    activeTab,
    canUseAuthFeatures,
    favoriteProductsPage,
    favoritePharmaciesPage,
    loadFavoriteProducts,
    loadFavoritePharmacies,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setOrdersVisibleCount(ORDERS_VISIBLE_STEP);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab]);

  useEffect(() => {
    if (!canUseAuthFeatures) {
      const timeoutId = window.setTimeout(() => {
        setOrders([]);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const controller = new AbortController();

    async function loadOrders() {
      try {
        setIsOrdersLoading(true);
        const response = await getOrders({ signal: controller.signal });

        if (!controller.signal.aborted) {
          setOrders([...response.items]);
        }
      } catch {
        if (!controller.signal.aborted) setOrders([]);
      } finally {
        if (!controller.signal.aborted) setIsOrdersLoading(false);
      }
    }

    void loadOrders();

    return () => {
      controller.abort();
    };
  }, [canUseAuthFeatures]);

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

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setSessionsError('');
      await revokeActiveSession(sessionId);
      setSessions((current) =>
        current.filter((session) => session.id !== sessionId)
      );
      toast.success('Session was revoked.');
    } catch {
      setSessionsError('Could not revoke the session.');
    }
  };

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

              <LinkButton href={ROUTES.LOGIN}>Go to login</LinkButton>
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
    toast.error(message);
  };

  const handlePictureChange = async (pictureUrl: string | null) => {
    if (!canUseAuthFeatures) return;

    const previousPictureUrl = picturePreview;

    try {
      setIsPictureSaving(true);
      setPicturePreview(pictureUrl);

      await updateCurrentUser({ pictureUrl: pictureUrl });
      await reloadCurrentUser();
      toast.success(
        pictureUrl ? 'Profile photo was updated.' : 'Profile photo was removed.'
      );
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Could not update profile photo.';

      toast.error(message);
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

      const nextProfileValues = normalizeDataProfileValues(profileValues);

      await updateCurrentUser(nextProfileValues);
      await reloadCurrentUser();
      setInitialProfileValues(nextProfileValues);
      setProfileTouchedFields({});
      toast.success('Profile data was updated.');
    } catch (error) {
      const message =
        error instanceof Error && error.message.toLowerCase().includes('phone')
          ? 'This phone number is already used by another account.'
          : error instanceof Error && error.message
            ? error.message
            : 'Could not update profile data.';

      toast.error(message);
    } finally {
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
      !passwordFormIsDirty
    ) {
      return;
    }

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
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Could not change password. Check the current password and try again.';

      toast.error(message);
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
                onChange={setActiveTab}
              />

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
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="sessions-title">
                        Active sessions and devices
                      </h2>
                      <p className={css.panelText}>
                        Review devices signed in to your account and revoke
                        sessions you no longer use.
                      </p>
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
                  <div className={css.ordersHeader}>
                    <h2 className={css.panelTitle}>My orders</h2>
                    <CountLabel
                      shown={visibleOrders.length}
                      total={orders.length}
                      label="orders"
                    />
                  </div>

                  <DataTable
                    columns={orderColumns}
                    items={visibleOrders}
                    getItemKey={(order) => String(order.id)}
                    isLoading={isOrdersLoading}
                    minWidth={620}
                    labels={{
                      loading: 'Loading orders...',
                      empty: 'Orders will appear here after checkout.',
                    }}
                  />

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
                      total={favoriteProductsCount}
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
                      total={favoritePharmaciesCount}
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

export default ProfilePageContent;
