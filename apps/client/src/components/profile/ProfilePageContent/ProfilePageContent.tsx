'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Heart, ImageOff, KeyRound, Store } from 'lucide-react';

import { Button, ButtonLink, Container, Tabs } from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { useAuth } from '@/components/providers';

import { PROFILE_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { createBreadcrumbs } from '@/lib/routes';
import {
  CUSTOMER_ADDRESS_MAX_LENGTH,
  CUSTOMER_NAME_MAX_LENGTH,
  CUSTOMER_PHONE_MAX_LENGTH,
  getCustomerAddressError,
  getCustomerNameError,
  getCustomerPhoneError,
  sanitizeCustomerAddress,
  sanitizeCustomerName,
  sanitizeCustomerPhone,
} from '@/lib/validations';
import { updateCurrentUser, updateCurrentUserPassword } from '@/services';

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

const TABS: Array<{
  value: ProfileTab;
  label: string;
}> = [
  { value: 'data', label: 'My data' },
  { value: 'orders', label: 'My orders' },
  { value: 'favorite-products', label: 'Favorite products' },
  { value: 'favorite-stores', label: 'Favorite stores' },
];

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;
const AVATAR_MAX_SIZE_BYTES = 800_000;

//===================================================================

function formatUserRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

//===================================================================

function formatUserStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

//===================================================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'U';

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

//===================================================================

function getPasswordError(value: string): string {
  if (!value) return '';

  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }

  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
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
    const nameError = getCustomerNameError(values.name);
    if (nameError) errors.name = nameError;
  }

  const phoneError = getCustomerPhoneError(values.phone);
  const addressError = getCustomerAddressError(values.address);

  if (phoneError) errors.phone = phoneError;
  if (addressError) errors.address = addressError;

  return errors;
}

//===================================================================

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
}

//===================================================================

function ProfilePageContent() {
  const { token, user, refreshCurrentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileValues({
      name: user.name ?? '',
      phone: user.phone ?? '',
      address: user.address ?? '',
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvatarPreview(user.avatarUrl ?? null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvatarChanged(false);
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

  const saveAvatar = async (avatarUrl: string | null) => {
    if (!token) return;

    try {
      setIsAvatarSaving(true);
      setFeedback('');
      setError('');

      await updateCurrentUser({ avatarUrl }, token);
      await refreshCurrentUser();
      setAvatarChanged(false);
      setFeedback(
        avatarUrl ? 'Profile photo was updated.' : 'Profile photo was removed.'
      );
    } catch {
      setError('Could not update profile photo.');
      setAvatarPreview(user.avatarUrl ?? null);
    } finally {
      setIsAvatarSaving(false);
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      setError('Avatar image must be up to 800 KB.');
      return;
    }

    try {
      const nextAvatar = await readImageAsDataUrl(file);

      setAvatarPreview(nextAvatar);
      setAvatarChanged(true);
      await saveAvatar(nextAvatar);
    } catch {
      setError('Could not read profile photo.');
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarPreview(null);
    setAvatarChanged(true);
    setFeedback('');
    setError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    await saveAvatar(null);
  };

  const handleSaveProfile = async () => {
    if (!token || !canSaveProfile) return;

    try {
      setIsProfileSaving(true);
      setFeedback('');
      setError('');

      await updateCurrentUser(
        {
          name: profileValues.name.trim(),
          phone: profileValues.phone.trim(),
          address: profileValues.address.trim(),
          ...(avatarChanged ? { avatarUrl: avatarPreview } : {}),
        },
        token
      );
      await refreshCurrentUser();
      setAvatarChanged(false);
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
    setError('');
    setPasswordValues((prev) => ({
      ...prev,
      [field]: value.slice(0, PASSWORD_MAX_LENGTH),
    }));
  };

  const handleSavePassword = async () => {
    if (!token || !canSavePassword) return;

    try {
      setIsPasswordSaving(true);
      setFeedback('');
      setError('');

      await updateCurrentUserPassword(passwordValues, token);
      setPasswordValues({ currentPassword: '', newPassword: '' });
      setFeedback('Password was changed.');
    } catch {
      setError(
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

          <div>
            <h1 className={css.title} id="profile-title">
              {PROFILE_TITLE}
            </h1>

            <p className={css.text}>
              View your account details, orders, favorites and profile photo.
            </p>
          </div>

          <div className={css.profileShell}>
            <aside className={css.sidebar} aria-label="Profile summary">
              <div className={css.avatar} aria-hidden="true">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={css.avatarImage} src={avatarPreview} alt="" />
                ) : (
                  <span>{getInitials(user.name)}</span>
                )}
              </div>

              <div className={css.nameBlock}>
                <h2 className={css.name}>{user.name}</h2>
                <p className={css.email}>{user.email}</p>
              </div>

              <dl className={css.compactDetails}>
                <div>
                  <dt>Role</dt>
                  <dd>{formatUserRole(user.role)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{formatUserStatus(user.status)}</dd>
                </div>
              </dl>
            </aside>

            <div className={css.contentCard}>
              <Tabs
                items={TABS}
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
                    <div className={css.avatarActions}>
                      <input
                        ref={fileInputRef}
                        className={css.fileInput}
                        type="file"
                        accept="image/*"
                        onChange={(event) => void handleAvatarChange(event)}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isAvatarSaving}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera size={18} aria-hidden="true" />
                        {isAvatarSaving
                          ? 'Updating photo...'
                          : 'Add / change photo'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={!avatarPreview || isAvatarSaving}
                        onClick={() => void handleRemoveAvatar()}
                      >
                        <ImageOff size={18} aria-hidden="true" />
                        Remove photo
                      </Button>
                    </div>

                    <div className={css.formGrid}>
                      <label className={css.field}>
                        <span className={css.fieldLabel}>Name</span>
                        <span className={css.controlWrap}>
                          <input
                            value={profileValues.name}
                            maxLength={CUSTOMER_NAME_MAX_LENGTH}
                            aria-invalid={Boolean(profileErrors.name)}
                            aria-describedby="profile-name-error"
                            onChange={(event) =>
                              handleProfileChange(
                                'name',
                                sanitizeCustomerName(event.target.value)
                              )
                            }
                          />
                          <span className={css.inputCounter}>
                            {profileValues.name.length}/
                            {CUSTOMER_NAME_MAX_LENGTH}
                          </span>
                          <span
                            className={css.errorText}
                            id="profile-name-error"
                            aria-live="polite"
                          >
                            {profileErrors.name}
                          </span>
                        </span>
                      </label>

                      <label className={css.field}>
                        <span className={css.fieldLabel}>Phone</span>
                        <span className={css.controlWrap}>
                          <input
                            value={profileValues.phone}
                            placeholder="+380XXXXXXXXX"
                            autoComplete="tel"
                            maxLength={CUSTOMER_PHONE_MAX_LENGTH}
                            aria-invalid={Boolean(profileErrors.phone)}
                            aria-describedby="profile-phone-error"
                            onChange={(event) =>
                              handleProfileChange(
                                'phone',
                                sanitizeCustomerPhone(event.target.value)
                              )
                            }
                          />
                          <span className={css.inputCounter}>
                            {profileValues.phone.length}/
                            {CUSTOMER_PHONE_MAX_LENGTH}
                          </span>
                          <span
                            className={css.errorText}
                            id="profile-phone-error"
                            aria-live="polite"
                          >
                            {profileErrors.phone}
                          </span>
                        </span>
                      </label>

                      <label className={css.fieldWide}>
                        <span className={css.fieldLabel}>
                          Delivery address / post office
                        </span>
                        <span className={css.controlWrap}>
                          <textarea
                            value={profileValues.address}
                            maxLength={CUSTOMER_ADDRESS_MAX_LENGTH}
                            placeholder="Add delivery address"
                            autoComplete="street-address"
                            aria-invalid={Boolean(profileErrors.address)}
                            aria-describedby="profile-address-error"
                            onChange={(event) =>
                              handleProfileChange(
                                'address',
                                sanitizeCustomerAddress(event.target.value)
                              )
                            }
                          />
                          <span className={css.textareaCounter}>
                            {profileValues.address.length}/
                            {CUSTOMER_ADDRESS_MAX_LENGTH}
                          </span>
                          <span
                            className={css.errorTextTextarea}
                            id="profile-address-error"
                            aria-live="polite"
                          >
                            {profileErrors.address}
                          </span>
                        </span>
                      </label>
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
                      <label className={css.field}>
                        <span className={css.fieldLabel}>Current password</span>
                        <span className={css.controlWrap}>
                          <input
                            type="password"
                            value={passwordValues.currentPassword}
                            autoComplete="current-password"
                            maxLength={PASSWORD_MAX_LENGTH}
                            aria-invalid={Boolean(
                              passwordErrors.currentPassword
                            )}
                            aria-describedby="current-password-error"
                            onChange={(event) =>
                              handlePasswordChange(
                                'currentPassword',
                                event.target.value
                              )
                            }
                          />
                          <span className={css.inputCounter}>
                            {passwordValues.currentPassword.length}/
                            {PASSWORD_MAX_LENGTH}
                          </span>
                          <span
                            className={css.errorText}
                            id="current-password-error"
                            aria-live="polite"
                          >
                            {passwordErrors.currentPassword}
                          </span>
                        </span>
                      </label>

                      <label className={css.field}>
                        <span className={css.fieldLabel}>New password</span>
                        <span className={css.controlWrap}>
                          <input
                            type="password"
                            value={passwordValues.newPassword}
                            autoComplete="new-password"
                            minLength={PASSWORD_MIN_LENGTH}
                            maxLength={PASSWORD_MAX_LENGTH}
                            aria-invalid={Boolean(passwordErrors.newPassword)}
                            aria-describedby="new-password-error"
                            onChange={(event) =>
                              handlePasswordChange(
                                'newPassword',
                                event.target.value
                              )
                            }
                          />
                          <span className={css.inputCounter}>
                            {passwordValues.newPassword.length}/
                            {PASSWORD_MAX_LENGTH}
                          </span>
                          <span
                            className={css.errorText}
                            id="new-password-error"
                            aria-live="polite"
                          >
                            {passwordErrors.newPassword}
                          </span>
                        </span>
                      </label>
                    </div>

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
                  <h2 className={css.panelTitle}>My orders</h2>
                  <div className={css.tableWrap}>
                    <table className={css.ordersTable}>
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Pharmacy</th>
                          <th>Status</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={4}>
                            Orders will appear here after checkout.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {activeTab === 'favorite-products' ? (
                <div className={css.emptyState} role="tabpanel">
                  <Heart size={28} aria-hidden="true" />
                  <h2 className={css.panelTitle}>Favorite products</h2>
                  <p className={css.panelText}>
                    Products you mark as favorite will be collected here.
                  </p>
                  <ButtonLink href={ROUTES.MEDICINES_CATALOG}>
                    Browse medicines
                  </ButtonLink>
                </div>
              ) : null}

              {activeTab === 'favorite-stores' ? (
                <div className={css.emptyState} role="tabpanel">
                  <Store size={28} aria-hidden="true" />
                  <h2 className={css.panelTitle}>Favorite stores</h2>
                  <p className={css.panelText}>
                    Favorite pharmacies will be shown here for quick reorders.
                  </p>
                  <ButtonLink href={ROUTES.STORES}>
                    Browse pharmacies
                  </ButtonLink>
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
