'use client';

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { Save } from 'lucide-react';

import { isApiError } from '@e-pharmacy/api-client/transport';
import { useAuth } from '@e-pharmacy/auth/react';
import { USER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { useToast } from '@e-pharmacy/ui/feedback';
import { EmailInput, NameInput } from '@e-pharmacy/ui/forms';

import {
  ProfileIdentityCard,
  ProfilePictureEditor,
  ProfileTabPanel,
  ProfileTabsLayout,
} from '@e-pharmacy/ui/profile';

import { Button } from '@e-pharmacy/ui/primitives';

import {
  PICTURE_ACCEPT,
  buildPictureFileError,
  buildPictureUrlError,
} from '@e-pharmacy/validation/files';

import {
  ACCOUNT_IDENTITY_FORM_FIELDS,
  isAccountIdentityFormDirty,
  isAccountIdentityFormValid,
  markAllFieldsTouched,
  normalizeAccountIdentityValues,
  validateAccountIdentityForm,
  type AccountIdentityFormErrors,
  type AccountIdentityTouchedFields,
  type AccountIdentityFormValues,
} from '@e-pharmacy/validation/profile';

import {
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
} from '@e-pharmacy/validation/auth';

import { updateMyAdminEmployeeProfile } from '@/lib/api/browser/admin-profile.api';
import { ADMIN_ACCESS_ERROR_CODES } from '@/lib/permissions/admin-access';
import { useAdminAuthorization } from '@/providers/AdminAuthorizationProvider';

import css from './AdminProfilePageContent.module.css';

//===================================================================

const PROFILE_TAB = 'personal' as const;

const PROFILE_TABS = [
  { value: PROFILE_TAB, label: 'Personal information' },
] as const;

const AUTH_EMAIL_CONFLICT = 'AUTH_EMAIL_CONFLICT';
const AUTH_PROFILE_CONFLICT = 'AUTH_PROFILE_CONFLICT';

//===================================================================

function getProfileErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return 'Could not update the profile. Please try again.';
  }

  if (error.backendCode === AUTH_EMAIL_CONFLICT) {
    return 'This email is already used by another account.';
  }

  if (error.backendCode === AUTH_PROFILE_CONFLICT) {
    return 'The profile changed in another session. Reload the page and try again.';
  }

  if (error.backendCode === ADMIN_ACCESS_ERROR_CODES.PLATFORM_OWNER_REQUIRED) {
    return 'Only a Platform Owner can change the admin name or email.';
  }

  return 'Could not update the profile. Please try again.';
}

//===================================================================

export function AdminProfilePageContent() {
  const { user, applyCurrentUser } = useAuth();
  const { access } = useAdminAuthorization();
  const toast = useToast();

  const [identityDraft, setIdentityDraft] =
    useState<AccountIdentityFormValues | null>(null);
  const [errors, setErrors] = useState<AccountIdentityFormErrors>({});
  const [touchedFields, setTouchedFields] =
    useState<AccountIdentityTouchedFields>({});
  const [pictureDraft, setPictureDraft] = useState<string | null | undefined>(
    undefined
  );
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [isSavingPicture, setIsSavingPicture] = useState(false);
  const mutationInFlightRef = useRef(false);

  const identityValues = useMemo<AccountIdentityFormValues>(
    () =>
      identityDraft ?? {
        name: user?.name ?? '',
        email: user?.email ?? '',
      },
    [identityDraft, user?.email, user?.name]
  );

  const initialIdentityValues = useMemo<AccountIdentityFormValues>(
    () => ({ name: user?.name ?? '', email: user?.email ?? '' }),
    [user?.email, user?.name]
  );

  if (!user) return null;

  const isPlatformOwner = access.isPlatformOwner;
  const isIdentityDirty = isAccountIdentityFormDirty(
    identityValues,
    initialIdentityValues
  );
  const isIdentityValid = isAccountIdentityFormValid(identityValues);
  const pictureUrl =
    pictureDraft === undefined ? (user.pictureUrl ?? null) : pictureDraft;

  const handleIdentityChange =
    (field: keyof AccountIdentityFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!isPlatformOwner || isSavingIdentity || isSavingPicture) return;

      const nextValues = { ...identityValues, [field]: event.target.value };
      const nextErrors = validateAccountIdentityForm(nextValues);

      setIdentityDraft(nextValues);
      setTouchedFields((current) => ({ ...current, [field]: true }));
      setErrors((current) => ({ ...current, [field]: nextErrors[field] }));
    };

  const handleIdentitySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isPlatformOwner || mutationInFlightRef.current) return;

    const nextErrors = validateAccountIdentityForm(identityValues);

    if (Object.keys(nextErrors).length > 0) {
      setTouchedFields(markAllFieldsTouched(ACCOUNT_IDENTITY_FORM_FIELDS));
      setErrors(nextErrors);
      return;
    }

    if (!isIdentityDirty) return;

    mutationInFlightRef.current = true;
    setIsSavingIdentity(true);

    try {
      const normalized = normalizeAccountIdentityValues(identityValues);
      const response = await updateMyAdminEmployeeProfile({
        ...normalized,
        expectedRevision: user.revision,
      });

      applyCurrentUser(response.user);
      setIdentityDraft(null);
      setErrors({});
      setTouchedFields({});
      toast.success('Personal information was updated.');
    } catch (error) {
      toast.error(getProfileErrorMessage(error));
    } finally {
      mutationInFlightRef.current = false;
      setIsSavingIdentity(false);
    }
  };

  const handlePictureChange = async (nextPictureUrl: string | null) => {
    if (mutationInFlightRef.current) return;

    mutationInFlightRef.current = true;
    setPictureDraft(nextPictureUrl);
    setIsSavingPicture(true);

    try {
      const response = await updateMyAdminEmployeeProfile({
        pictureUrl: nextPictureUrl,
        expectedRevision: user.revision,
      });

      applyCurrentUser(response.user);
      setPictureDraft(undefined);
      toast.success(
        nextPictureUrl
          ? 'Profile photo was updated.'
          : 'Profile photo was removed.'
      );
    } catch (error) {
      setPictureDraft(undefined);
      toast.error(getProfileErrorMessage(error));
    } finally {
      mutationInFlightRef.current = false;
      setIsSavingPicture(false);
    }
  };

  return (
    <section className={css.page} aria-labelledby="admin-profile-title">
      <div className={css.heading}>
        <h1 id="admin-profile-title">Profile</h1>
        <p>Manage the identity shown across the Admin Cabinet.</p>
      </div>

      <ProfileTabsLayout
        idBase="admin-profile"
        items={[...PROFILE_TABS]}
        activeValue={PROFILE_TAB}
        ariaLabel="Admin profile sections"
        sidebar={
          <ProfileIdentityCard
            name={user.name}
            email={user.email}
            roleLabel={isPlatformOwner ? 'Platform Owner' : 'Admin employee'}
            statusLabel={USER_STATUS_PRESENTATION[user.status].label}
            pictureEditor={
              <ProfilePictureEditor
                pictureUrl={pictureUrl}
                name={user.name}
                accept={PICTURE_ACCEPT}
                disabled={isSavingPicture || isSavingIdentity}
                isSaving={isSavingPicture}
                validateFile={(file) => buildPictureFileError(file) || null}
                validatePictureUrl={(value) =>
                  buildPictureUrlError(value) || null
                }
                onChange={handlePictureChange}
                onError={toast.error}
              />
            }
          />
        }
        onChange={() => undefined}
      >
        <ProfileTabPanel
          idBase="admin-profile"
          value={PROFILE_TAB}
          activeValue={PROFILE_TAB}
        >
          <form
            className={css.personalForm}
            noValidate
            onSubmit={handleIdentitySubmit}
          >
            <div className={css.formHeader}>
              <div>
                <h2>Personal information</h2>
                <p>
                  {isPlatformOwner
                    ? 'Keep the Platform Owner name and email up to date.'
                    : 'Your name and email are managed by the Platform Owner.'}
                </p>
              </div>

              {isPlatformOwner ? (
                <Button
                  type="submit"
                  iconLeft={<Save size={18} aria-hidden="true" />}
                  disabled={
                    isSavingIdentity ||
                    isSavingPicture ||
                    !isIdentityDirty ||
                    !isIdentityValid
                  }
                  isLoading={isSavingIdentity}
                  loadingLabel="Saving..."
                >
                  Save changes
                </Button>
              ) : null}
            </div>

            <div className={css.formGrid}>
              <NameInput
                id="admin-profile-name"
                name="name"
                value={identityValues.name}
                error={errors.name}
                isTouched={Boolean(touchedFields.name)}
                required={isPlatformOwner}
                maxLength={USER_NAME_MAX_LENGTH}
                disabled={
                  !isPlatformOwner || isSavingIdentity || isSavingPicture
                }
                onChange={handleIdentityChange('name')}
              />

              <EmailInput
                id="admin-profile-email"
                name="email"
                value={identityValues.email}
                error={errors.email}
                isTouched={Boolean(touchedFields.email)}
                required={isPlatformOwner}
                maxLength={USER_EMAIL_MAX_LENGTH}
                disabled={
                  !isPlatformOwner || isSavingIdentity || isSavingPicture
                }
                onChange={handleIdentityChange('email')}
              />
            </div>
          </form>
        </ProfileTabPanel>
      </ProfileTabsLayout>
    </section>
  );
}
