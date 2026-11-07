'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@e-pharmacy/auth/react';
import type { OwnedPharmacyOption } from '@e-pharmacy/types/pharmacies';

import {
  getOwnedPharmacyMemberships,
  getOwnedPharmacyOptions,
} from '@/lib/api/browser/owned-pharmacy-registry.api';

import {
  getPharmacyIdFromDetailPath,
  isOwnerClientsListPath,
  isOwnerClientDetailPath,
  isLegacyOperationalPharmacyPath,
  isOperationalPharmacyPath,
  readExplicitPharmacySelection,
  resolveSelectedPharmacyId,
  setAuthorizedPharmacySelection,
  withSelectedPharmacyQuery,
} from '@/lib/pharmacies/selected-pharmacy-scope';

//===================================================================

const STORAGE_KEY = 'e-pharmacy:selected-pharmacy:';

//===================================================================

type Membership = Readonly<{
  id: string;
  membershipRole: 'owner' | 'manager';
}>;

type MembershipSnapshot = Readonly<{
  identity: string;
  memberships: readonly Membership[];
  options: readonly OwnedPharmacyOption[];
  error: boolean;
}>;

type SelectionContext = Readonly<{
  selectedId: string | null;
  memberships: readonly Membership[];
  options: readonly OwnedPharmacyOption[];
  isLoading: boolean;
  isInvalid: boolean;
  isOperational: boolean;
  select: (pharmacyId: string) => void;
}>;

//===================================================================

const EMPTY_MEMBERSHIPS: readonly Membership[] = [];
const EMPTY_OPTIONS: readonly OwnedPharmacyOption[] = [];

const Context = createContext<SelectionContext | null>(null);

//===================================================================

export function PharmacySelectionProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { user, canRenderAuthenticatedContent } = useAuth();

  const identity =
    canRenderAuthenticatedContent && user?.role === 'pharmacy' ? user.id : null;

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const search = params.toString();

  const [snapshot, setSnapshot] = useState<MembershipSnapshot | null>(null);

  const [preferred, setPreferred] = useState<{
    identity: string;
    id: string | null;
  } | null>(null);

  useEffect(() => {
    setAuthorizedPharmacySelection(null);

    if (!identity) return;

    const controller = new AbortController();

    void getOwnedPharmacyMemberships({ signal: controller.signal })
      .then((memberships) => {
        if (controller.signal.aborted) return;

        let saved: string | null = null;

        try {
          saved =
            window.sessionStorage
              .getItem(`${STORAGE_KEY}${identity}`)
              ?.toLowerCase() ?? null;
        } catch {
          // Preference storage is optional, never an authorization source.
        }

        const preferredId =
          saved && memberships.some((m) => m.id.toLowerCase() === saved)
            ? saved
            : null;

        setPreferred({ identity, id: preferredId });

        setSnapshot({
          identity,
          memberships,
          options: EMPTY_OPTIONS,
          error: false,
        });

        // Labels are optional: they must not delay membership authorization.
        void getOwnedPharmacyOptions(
          { limit: 50 },
          { signal: controller.signal }
        )
          .then((result) => {
            if (controller.signal.aborted) return;

            setSnapshot((current) =>
              current?.identity === identity
                ? { ...current, options: result.items }
                : current
            );
          })
          .catch(() => {
            // A safe ID fallback remains available when names cannot load.
          });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSnapshot({
            identity,
            memberships: EMPTY_MEMBERSHIPS,
            options: EMPTY_OPTIONS,
            error: true,
          });
        }
      });

    return () => controller.abort();
  }, [identity]);

  const validSnapshot = snapshot?.identity === identity ? snapshot : null;
  const memberships = validSnapshot?.memberships ?? EMPTY_MEMBERSHIPS;
  const isOperational = isOperationalPharmacyPath(pathname);
  const explicit = readExplicitPharmacySelection(pathname, search);
  const savedId = preferred?.identity === identity ? preferred.id : null;

  // Explicit URLs take precedence. A denied selection never silently falls
  // back to another pharmacy, including the last one in session storage.
  const selectedId =
    validSnapshot && !validSnapshot.error
      ? resolveSelectedPharmacyId({
          explicit,
          preferredId: savedId,
          memberships,
        })
      : null;

  const isInvalid = Boolean(
    explicit.invalid ||
    (explicit.id &&
      validSnapshot &&
      !memberships.some((m) => m.id.toLowerCase() === explicit.id)) ||
    validSnapshot?.error
  );

  // Parent layout effects commit before child resource effects, so requests
  // for a newly selected tab cannot carry the previous pharmacy header.
  useLayoutEffect(() => {
    setAuthorizedPharmacySelection(selectedId);
    return () => setAuthorizedPharmacySelection(null);
  }, [selectedId]);

  // Stage 14.18.16: old selected-pharmacy bookmarks for the owner Clients
  // registry canonicalize to the account-wide URL without discarding filters.
  useEffect(() => {
    if (
      !pathname.startsWith('/pharmacy/all-products') &&
      !isOwnerClientsListPath(pathname) &&
      !isOwnerClientDetailPath(pathname)
    )
      return;

    const query = new URLSearchParams(search);

    if (!query.has('pharmacyId')) return;

    query.delete('pharmacyId');

    const tail = query.toString();
    router.replace(`${pathname}${tail ? `?${tail}` : ''}`, { scroll: false });
  }, [pathname, router, search]);

  useEffect(() => {
    if (!identity || !selectedId) return;

    try {
      window.sessionStorage.setItem(`${STORAGE_KEY}${identity}`, selectedId);
    } catch {
      // Restricted storage must not block navigation.
    }

    // Legacy links keep their pharmacy in the URL even after list filtering.
    if (
      isLegacyOperationalPharmacyPath(pathname) &&
      !explicit.id &&
      !explicit.invalid
    ) {
      router.replace(withSelectedPharmacyQuery(pathname, search, selectedId), {
        scroll: false,
      });
    }
  }, [
    identity,
    selectedId,
    pathname,
    search,
    explicit.id,
    explicit.invalid,
    router,
  ]);

  const select = useCallback(
    (id: string) => {
      if (
        !identity ||
        !memberships.some((m) => m.id.toLowerCase() === id.toLowerCase())
      ) {
        return;
      }

      const nextId = id.toLowerCase();

      setPreferred({ identity, id: nextId });

      const detailId = getPharmacyIdFromDetailPath(pathname);

      if (detailId) {
        router.push(pathname.replace(detailId, nextId), { scroll: false });
        return;
      }

      router.push(withSelectedPharmacyQuery(pathname, search, nextId), {
        scroll: false,
      });
    },
    [identity, memberships, pathname, router, search, setPreferred]
  );

  const value = useMemo(
    () => ({
      selectedId,
      memberships,
      options: validSnapshot?.options ?? EMPTY_OPTIONS,
      isLoading: Boolean(identity && !validSnapshot),
      isInvalid,
      isOperational,
      select,
    }),
    [
      selectedId,
      memberships,
      validSnapshot,
      identity,
      isInvalid,
      isOperational,
      select,
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

//===================================================================

export function usePharmacySelection(): SelectionContext {
  const context = useContext(Context);

  if (!context) {
    throw new Error('usePharmacySelection requires PharmacySelectionProvider.');
  }

  return context;
}
