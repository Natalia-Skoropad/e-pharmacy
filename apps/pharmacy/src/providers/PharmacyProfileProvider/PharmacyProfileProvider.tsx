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

import { useAuth } from '@e-pharmacy/auth/react';

import type {
  CurrentPharmacySummary,
  CurrentPharmacySummaryResponse,
  MyPharmacyProfile,
} from '@e-pharmacy/types/pharmacies';

import { getCurrentPharmacySummary } from '@/lib/api/browser/pharmacy.api';

import {
  invalidatePharmacyProfileRequest,
  isCurrentPharmacyProfileRequest,
} from './pharmacy-profile-request';

import {
  createPharmacyProfileRefreshErrorSnapshot,
  createPharmacyProfileRefreshStartSnapshot,
  type PharmacyProfileSnapshot,
} from './pharmacy-profile-state';

//===================================================================

type PharmacyProfileContextValue = Readonly<{
  profile: CurrentPharmacySummary | null;
  isLoading: boolean;
  error: unknown;
  refresh: () => Promise<CurrentPharmacySummary | null>;
  syncProfile: (profile: MyPharmacyProfile) => void;
}>;

//===================================================================

const PharmacyProfileContext =
  createContext<PharmacyProfileContextValue | null>(null);

//===================================================================

type PharmacyProfileAuthState = Readonly<{
  user: Readonly<{ id: string; role: string }> | null;
  isBootstrapping: boolean;
  canRenderAuthenticatedContent: boolean;
}>;

type PharmacySummaryLoader = (
  options?: Readonly<{ signal?: AbortSignal }>
) => Promise<CurrentPharmacySummaryResponse>;

//===================================================================

export function PharmacyProfileProvider({ children }: { children: ReactNode }) {
  const authState = useAuth();

  return (
    <PharmacyProfileProviderRuntime
      authState={authState}
      loadSummary={getCurrentPharmacySummary}
    >
      {children}
    </PharmacyProfileProviderRuntime>
  );
}

//===================================================================

export function PharmacyProfileProviderRuntime({
  children,
  authState,
  loadSummary,
}: Readonly<{
  children?: ReactNode;
  authState: PharmacyProfileAuthState;
  loadSummary: PharmacySummaryLoader;
}>) {
  const { user, isBootstrapping, canRenderAuthenticatedContent } = authState;

  const identity =
    canRenderAuthenticatedContent && user?.role === 'pharmacy' ? user.id : null;

  const [snapshot, setSnapshot] = useState<PharmacyProfileSnapshot | null>(
    null
  );

  const identityRef = useRef(identity);
  const requestVersionRef = useRef(0);
  const activeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    identityRef.current = identity;
  }, [identity]);

  const requestProfile = useCallback(
    async (requestIdentity: string): Promise<CurrentPharmacySummary | null> => {
      activeControllerRef.current?.abort();
      const controller = new AbortController();
      activeControllerRef.current = controller;
      const requestVersion = requestVersionRef.current + 1;
      requestVersionRef.current = requestVersion;

      try {
        const response = await loadSummary({
          signal: controller.signal,
        });

        if (
          !isCurrentPharmacyProfileRequest({
            currentIdentity: identityRef.current,
            requestIdentity,
            currentVersion: requestVersionRef.current,
            requestVersion,
            aborted: controller.signal.aborted,
          })
        ) {
          return null;
        }

        return response.pharmacy;
      } catch (cause) {
        if (
          !isCurrentPharmacyProfileRequest({
            currentIdentity: identityRef.current,
            requestIdentity,
            currentVersion: requestVersionRef.current,
            requestVersion,
            aborted: controller.signal.aborted,
          })
        ) {
          return null;
        }

        throw cause;
      } finally {
        if (
          activeControllerRef.current === controller &&
          requestVersionRef.current === requestVersion
        ) {
          activeControllerRef.current = null;
        }
      }
    },
    [loadSummary]
  );

  const invalidatePendingRequest = useCallback(() => {
    requestVersionRef.current = invalidatePharmacyProfileRequest({
      currentVersion: requestVersionRef.current,
      controller: activeControllerRef.current,
    });
    activeControllerRef.current = null;
  }, []);

  const syncProfile = useCallback(
    (profile: MyPharmacyProfile) => {
      if (!identity || identityRef.current !== identity) return;

      invalidatePendingRequest();
      setSnapshot({
        identity,
        profile: {
          id: profile.id,
          name: profile.name,
          status: profile.status,
          ...(profile.imageUrl ? { imageUrl: profile.imageUrl } : {}),
          membershipRole: profile.membershipRole,
        },
        isLoading: false,
        error: null,
      });
    },
    [identity, invalidatePendingRequest]
  );

  //===================================================================

  const refresh = useCallback(async () => {
    if (!identity) return null;

    setSnapshot((currentSnapshot) =>
      createPharmacyProfileRefreshStartSnapshot(currentSnapshot, identity)
    );

    try {
      const profile = await requestProfile(identity);

      if (profile === null || identityRef.current !== identity) {
        return null;
      }

      setSnapshot({
        identity,
        profile,
        isLoading: false,
        error: null,
      });

      return profile;
    } catch (cause) {
      if (identityRef.current !== identity) {
        return null;
      }

      setSnapshot((currentSnapshot) =>
        createPharmacyProfileRefreshErrorSnapshot(
          currentSnapshot,
          identity,
          cause
        )
      );

      return null;
    }
  }, [identity, requestProfile]);

  useEffect(() => {
    if (isBootstrapping) return;

    if (!identity) {
      invalidatePendingRequest();
      return;
    }

    const requestIdentity = identity;

    void requestProfile(requestIdentity)
      .then((profile) => {
        if (profile === null || identityRef.current !== requestIdentity) {
          return;
        }

        setSnapshot({
          identity: requestIdentity,
          profile,
          isLoading: false,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (identityRef.current !== requestIdentity) {
          return;
        }

        setSnapshot({
          identity: requestIdentity,
          profile: null,
          isLoading: false,
          error: cause,
        });
      });
  }, [identity, invalidatePendingRequest, isBootstrapping, requestProfile]);

  useEffect(() => () => invalidatePendingRequest(), [invalidatePendingRequest]);

  const hasCurrentSnapshot =
    identity !== null && snapshot?.identity === identity;

  const value = useMemo(
    () => ({
      profile: hasCurrentSnapshot ? snapshot.profile : null,
      isLoading:
        isBootstrapping ||
        (identity !== null && (!hasCurrentSnapshot || snapshot.isLoading)),
      error: hasCurrentSnapshot ? snapshot.error : null,
      refresh,
      syncProfile,
    }),
    [
      hasCurrentSnapshot,
      identity,
      isBootstrapping,
      refresh,
      snapshot,
      syncProfile,
    ]
  );

  return (
    <PharmacyProfileContext.Provider value={value}>
      {children}
    </PharmacyProfileContext.Provider>
  );
}

//===================================================================

export function usePharmacyProfile(): PharmacyProfileContextValue {
  const context = useContext(PharmacyProfileContext);

  if (!context) {
    throw new Error(
      'usePharmacyProfile must be used inside PharmacyProfileProvider.'
    );
  }

  return context;
}
