'use client';

import { ButtonLink, Container } from '@/components/common';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { useAuth } from '@/components/providers';

import { PROFILE_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { createBreadcrumbs } from '@/lib/routes';

import css from './ProfilePageContent.module.css';

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
  const parts = name.trim().split(/\s+/);

  if (parts.length === 0) return 'U';

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

//===================================================================

function ProfilePageContent() {
  const { user } = useAuth();

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
                View your account details and manage your E-PHARMACY profile.
              </p>
            </div>

            <ButtonLink href={ROUTES.HOME} variant="secondary">
              Back to home
            </ButtonLink>
          </div>

          <div className={css.card}>
            <div className={css.avatar} aria-hidden="true">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={css.avatarImage} src={user.avatarUrl} alt="" />
              ) : (
                <span>{getInitials(user.name)}</span>
              )}
            </div>

            <div className={css.info}>
              <div className={css.nameBlock}>
                <h2 className={css.name}>{user.name}</h2>
                <p className={css.email}>{user.email}</p>
              </div>

              <dl className={css.details}>
                <div className={css.detailItem}>
                  <dt className={css.detailLabel}>User ID</dt>
                  <dd className={css.detailValue}>{user.id}</dd>
                </div>

                <div className={css.detailItem}>
                  <dt className={css.detailLabel}>Role</dt>
                  <dd className={css.detailValue}>
                    {formatUserRole(user.role)}
                  </dd>
                </div>

                <div className={css.detailItem}>
                  <dt className={css.detailLabel}>Status</dt>
                  <dd className={css.detailValue}>
                    {formatUserStatus(user.status)}
                  </dd>
                </div>

                <div className={css.detailItem}>
                  <dt className={css.detailLabel}>Phone</dt>
                  <dd className={css.detailValue}>
                    {user.phone || 'Not added yet'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default ProfilePageContent;
