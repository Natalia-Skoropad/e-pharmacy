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
import type { PharmacyProfile } from '@e-pharmacy/types/pharmacies';

import { getMyPharmacyProfile } from '@/lib/api/browser';

import { isCurrentPharmacyProfileRequest } from './pharmacy-profile-request';

//===================================================================

type PharmacyProfileContextValue = Readonly<{
  profile: PharmacyProfile | null;
  isLoading: boolean;
  error: unknown;
  refresh: () => Promise<PharmacyProfile | null>;
  syncProfile: (profile: PharmacyProfile) => void;
}>;

type PharmacyProfileSnapshot = Readonly<{
  identity: string;
  profile: PharmacyProfile | null;
  isLoading: boolean;
  error: unknown;
}>;

//===================================================================

const PharmacyProfileContext =
  createContext<PharmacyProfileContextValue | null>(null);

//===================================================================

export function PharmacyProfileProvider({ children }: { children: ReactNode }) {
  const { user, isBootstrapping, canRenderAuthenticatedContent } = useAuth();

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
    async (requestIdentity: string): Promise<PharmacyProfile | null> => {
      activeControllerRef.current?.abort();
      const controller = new AbortController();
      activeControllerRef.current = controller;
      const requestVersion = requestVersionRef.current + 1;
      requestVersionRef.current = requestVersion;

      try {
        const response = await getMyPharmacyProfile({
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
    []
  );

  const syncProfile = useCallback(
    (profile: PharmacyProfile) => {
      if (!identity) return;

      setSnapshot({
        identity,
        profile,
        isLoading: false,
        error: null,
      });
    },
    [identity]
  );

  //===================================================================

  const refresh = useCallback(async () => {
    if (!identity) return null;

    setSnapshot((currentSnapshot) => ({
      identity,
      profile:
        currentSnapshot?.identity === identity ? currentSnapshot.profile : null,
      isLoading: true,
      error: null,
    }));

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

      setSnapshot({
        identity,
        profile: null,
        isLoading: false,
        error: cause,
      });

      return null;
    }
  }, [identity, requestProfile]);

  useEffect(() => {
    if (isBootstrapping) return;

    if (!identity) {
      requestVersionRef.current += 1;
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
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
  }, [identity, isBootstrapping, requestProfile]);

  useEffect(
    () => () => {
      requestVersionRef.current += 1;
      activeControllerRef.current?.abort();
      activeControllerRef.current = null;
    },
    []
  );

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
