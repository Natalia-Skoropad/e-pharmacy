'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { isApiError } from '@e-pharmacy/api-client/transport';
import { Button } from '@e-pharmacy/ui/primitives';
import { PageLoader, StatusPageLayout } from '@e-pharmacy/ui/status-pages';

import { getCurrentAdminAccess } from '@/lib/api/browser/admin-access.api';

import {
  ADMIN_ACCESS_ERROR_CODES,
  type AdminAccess,
} from '@/lib/permissions/admin-access';

import { STATUS_PAGE_IMAGE } from '@/lib/status-pages/status-page-image';

//===================================================================

type AdminAuthorizationContextValue = Readonly<{
  access: AdminAccess;
  retry: () => void;
}>;

type AdminAuthorizationState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'ready'; access: AdminAccess }>
  | Readonly<{ status: 'revoked' }>
  | Readonly<{ status: 'denied' }>
  | Readonly<{ status: 'error' }>;

//===================================================================

const AdminAuthorizationContext =
  createContext<AdminAuthorizationContextValue | null>(null);

//===================================================================

function classifyAdminAccessError(error: unknown): AdminAuthorizationState {
  if (!isApiError(error)) return { status: 'error' };

  if (error.backendCode === ADMIN_ACCESS_ERROR_CODES.ACCESS_REVOKED) {
    return { status: 'revoked' };
  }

  if (
    error.backendCode === ADMIN_ACCESS_ERROR_CODES.ACCESS_REQUIRED ||
    error.backendCode === ADMIN_ACCESS_ERROR_CODES.INVALID_ACCESS_RECORD ||
    error.backendCode === ADMIN_ACCESS_ERROR_CODES.PERMISSION_DENIED
  ) {
    return { status: 'denied' };
  }

  return { status: 'error' };
}

//===================================================================

type AccessStateProps = Readonly<{
  title: string;
  description: string;
  onRetry: () => void;
}>;

//===================================================================

function AccessState({ title, description, onRetry }: AccessStateProps) {
  return (
    <StatusPageLayout
      eyebrow="Admin access"
      title={title}
      description={description}
      variant="brand"
      landmark="main"
      image={STATUS_PAGE_IMAGE}
      actions={
        <Button type="button" size="lg" onClick={onRetry}>
          Retry access
        </Button>
      }
    />
  );
}

//===================================================================

type AdminAuthorizationProviderProps = Readonly<{
  children: ReactNode;
}>;

//===================================================================

export function AdminAuthorizationProvider({
  children,
}: AdminAuthorizationProviderProps) {
  const [state, setState] = useState<AdminAuthorizationState>({
    status: 'loading',
  });

  const [retryVersion, setRetryVersion] = useState(0);
  const requestVersionRef = useRef(0);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setRetryVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;

    void getCurrentAdminAccess({ signal: controller.signal })
      .then(({ access }) => {
        if (
          controller.signal.aborted ||
          requestVersionRef.current !== requestVersion
        ) {
          return;
        }

        setState({ status: 'ready', access });
      })
      .catch((error: unknown) => {
        if (
          controller.signal.aborted ||
          requestVersionRef.current !== requestVersion
        ) {
          return;
        }

        setState(classifyAdminAccessError(error));
      });

    return () => controller.abort();
  }, [retryVersion]);

  const value = useMemo<AdminAuthorizationContextValue | null>(() => {
    if (state.status !== 'ready') return null;
    return { access: state.access, retry };
  }, [retry, state]);

  if (state.status === 'loading') {
    return <PageLoader label="Checking admin permissions..." />;
  }

  if (state.status === 'revoked') {
    return (
      <AccessState
        title="Admin access has been revoked"
        description="This account is still authenticated, but its Admin Cabinet access is no longer active. If access was restored, retry the authorization check."
        onRetry={retry}
      />
    );
  }

  if (state.status === 'denied') {
    return (
      <AccessState
        title="Admin access is unavailable"
        description="This account does not have a valid Admin Cabinet access record. Access is denied by default until the authorization record is restored."
        onRetry={retry}
      />
    );
  }

  if (state.status === 'error') {
    return (
      <AccessState
        title="We could not verify admin permissions"
        description="The authorization service is temporarily unavailable. Retry before opening protected admin features."
        onRetry={retry}
      />
    );
  }

  if (!value) return null;

  return (
    <AdminAuthorizationContext.Provider value={value}>
      {children}
    </AdminAuthorizationContext.Provider>
  );
}

//===================================================================

export function useAdminAuthorization(): AdminAuthorizationContextValue {
  const context = useContext(AdminAuthorizationContext);

  if (!context) {
    throw new Error(
      'useAdminAuthorization must be used inside AdminAuthorizationProvider.'
    );
  }

  return context;
}
