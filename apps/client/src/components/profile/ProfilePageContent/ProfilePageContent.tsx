'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Heart, ImageOff, KeyRound, PackageCheck, Store, UserRound } from 'lucide-react';

import { Button, ButtonLink, Container } from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { useAuth } from '@/components/providers';

import { PROFILE_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { createBreadcrumbs } from '@/lib/routes';
import {
  CUSTOMER_ADDRESS_MAX_LENGTH,
  CUSTOMER_ADDRESS_MIN_LENGTH,
  CUSTOMER_NAME_MAX_LENGTH,
  CUSTOMER_PHONE_MAX_LENGTH,
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

const TABS: Array<{ value: ProfileTab; label: string; icon: typeof UserRound }> = [
  { value: 'data', label: 'My data', icon: UserRound },
  { value: 'orders', label: 'My orders', icon: PackageCheck },
  { value: 'favorite-products', label: 'Favorite products', icon: Heart },
  { value: 'favorite-stores', label: 'Favorite stores', icon: Store },
];

const PASSWORD_MIN_LENGTH = 8;
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

function getProfileErrors(values: ProfileFormValues) {
  const errors: Partial<Record<keyof ProfileFormValues, string>> = {};
  const name = values.name.trim();
  const phone = values.phone.trim();
  const address = values.address.trim();

  if (!name) errors.name = 'Name is required';
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters';
  else if (name.length > CUSTOMER_NAME_MAX_LENGTH) {
    errors.name = `Name must be at most ${CUSTOMER_NAME_MAX_LENGTH} characters`;
  }

  if (phone && phone.length !== CUSTOMER_PHONE_MAX_LENGTH) {
    errors.phone = 'Enter phone in format +380XXXXXXXXX';
  }

  if (address && address.length < CUSTOMER_ADDRESS_MIN_LENGTH) {
    errors.address = `Address must be at least ${CUSTOMER_ADDRESS_MIN_LENGTH} characters`;
  } else if (address.length > CUSTOMER_ADDRESS_MAX_LENGTH) {
    errors.address = `Address must be at most ${CUSTOMER_ADDRESS_MAX_LENGTH} characters`;
  }

  return errors;
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

  useEffect(() => {
    if (!user) return;

    setProfileValues({
      name: user.name ?? '',
      phone: user.phone ?? '',
      address: user.address ?? '',
    });
    setAvatarPreview(user.avatarUrl ?? null);
    setAvatarChanged(false);
  }, [user]);

  const profileErrors = useMemo(
    () => getProfileErrors(profileValues),
    [profileValues]
  );
  const canSaveProfile = Object.keys(profileErrors).length === 0;
  const canSavePassword =
    passwordValues.currentPassword.trim().length > 0 &&
    passwordValues.newPassword.length >= PASSWORD_MIN_LENGTH;

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

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
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

    const reader = new FileReader();

    reader.onload = () => {
      setAvatarPreview(String(reader.result));
      setAvatarChanged(true);
      setFeedback('');
      setError('');
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarChanged(true);
    setFeedback('');
    setError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      setError('Could not change password. Check the current password and try again.');
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <main className={css.page}>
      <section className={css.section} aria-labelledby="profile-title">
        <Container>
          <Breadcrumbs items={createBreadcrumbs(PROFILE_TITLE)} />

          <div className={css.header}>
            <div>
              <p className={css.kicker}>Personal account</p>

              <h1 className={css.title} id="profile-title">
                {PROFILE_TITLE}
              </h1>

              <p className={css.text}>
                View your account details, orders, favorites and profile photo.
              </p>
            </div>

            <ButtonLink href={ROUTES.HOME} variant="secondary">
              Back to home
            </ButtonLink>
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
              <div className={css.tabs} role="tablist" aria-label="Profile sections">
                {TABS.map(({ value, label, icon: Icon }) => (
                  <button
                    className={activeTab === value ? css.tabActive : css.tab}
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === value}
                    onClick={() => setActiveTab(value)}
                  >
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>

              {feedback ? <p className={css.feedback}>{feedback}</p> : null}
              {error ? <p className={css.error} role="alert">{error}</p> : null}

              {activeTab === 'data' ? (
                <div className={css.tabPanel} role="tabpanel">
                  <section className={css.panelSection} aria-labelledby="personal-data-title">
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="personal-data-title">
                        My data
                      </h2>
                      <p className={css.panelText}>
                        Update contact details so the pharmacy can reach you without detective work.
                      </p>
                    </div>

                    <div className={css.avatarActions}>
                      <input
                        ref={fileInputRef}
                        className={css.fileInput}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera size={18} aria-hidden="true" />
                        Add / change photo
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={!avatarPreview}
                        onClick={handleRemoveAvatar}
                      >
                        <ImageOff size={18} aria-hidden="true" />
                        Remove photo
                      </Button>
                    </div>

                    <div className={css.formGrid}>
                      <label className={css.field}>
                        <span>Name</span>
                        <input
                          value={profileValues.name}
                          maxLength={CUSTOMER_NAME_MAX_LENGTH}
                          aria-invalid={Boolean(profileErrors.name)}
                          onChange={(event) =>
                            handleProfileChange(
                              'name',
                              sanitizeCustomerName(event.target.value)
                            )
                          }
                        />
                        {profileErrors.name ? (
                          <small>{profileErrors.name}</small>
                        ) : null}
                      </label>

                      <label className={css.field}>
                        <span>Email</span>
                        <input value={user.email} disabled />
                      </label>

                      <label className={css.field}>
                        <span>Phone</span>
                        <input
                          value={profileValues.phone}
                          placeholder="+380XXXXXXXXX"
                          maxLength={CUSTOMER_PHONE_MAX_LENGTH}
                          aria-invalid={Boolean(profileErrors.phone)}
                          onChange={(event) =>
                            handleProfileChange(
                              'phone',
                              sanitizeCustomerPhone(event.target.value)
                            )
                          }
                        />
                        {profileErrors.phone ? (
                          <small>{profileErrors.phone}</small>
                        ) : null}
                      </label>

                      <label className={css.fieldWide}>
                        <span>Address</span>
                        <textarea
                          value={profileValues.address}
                          maxLength={CUSTOMER_ADDRESS_MAX_LENGTH}
                          placeholder="Add delivery address"
                          aria-invalid={Boolean(profileErrors.address)}
                          onChange={(event) =>
                            handleProfileChange(
                              'address',
                              sanitizeCustomerAddress(event.target.value)
                            )
                          }
                        />
                        {profileErrors.address ? (
                          <small>{profileErrors.address}</small>
                        ) : null}
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

                  <section className={css.panelSection} aria-labelledby="password-title">
                    <div className={css.panelHeader}>
                      <h2 className={css.panelTitle} id="password-title">
                        Change password
                      </h2>
                      <p className={css.panelText}>
                        Keep your account locked tighter than grandma’s medicine cabinet.
                      </p>
                    </div>

                    <div className={css.formGrid}>
                      <label className={css.field}>
                        <span>Current password</span>
                        <input
                          type="password"
                          value={passwordValues.currentPassword}
                          autoComplete="current-password"
                          onChange={(event) =>
                            setPasswordValues((prev) => ({
                              ...prev,
                              currentPassword: event.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className={css.field}>
                        <span>New password</span>
                        <input
                          type="password"
                          value={passwordValues.newPassword}
                          autoComplete="new-password"
                          minLength={PASSWORD_MIN_LENGTH}
                          onChange={(event) =>
                            setPasswordValues((prev) => ({
                              ...prev,
                              newPassword: event.target.value,
                            }))
                          }
                        />
                        {passwordValues.newPassword &&
                        passwordValues.newPassword.length < PASSWORD_MIN_LENGTH ? (
                          <small>Password must be at least 8 characters</small>
                        ) : null}
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
                          <td colSpan={4}>Orders will appear here after checkout.</td>
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
                  <ButtonLink href={ROUTES.MEDICINES_CATALOG}>Browse medicines</ButtonLink>
                </div>
              ) : null}

              {activeTab === 'favorite-stores' ? (
                <div className={css.emptyState} role="tabpanel">
                  <Store size={28} aria-hidden="true" />
                  <h2 className={css.panelTitle}>Favorite stores</h2>
                  <p className={css.panelText}>
                    Favorite pharmacies will be shown here for quick reorders.
                  </p>
                  <ButtonLink href={ROUTES.STORES}>Browse pharmacies</ButtonLink>
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
