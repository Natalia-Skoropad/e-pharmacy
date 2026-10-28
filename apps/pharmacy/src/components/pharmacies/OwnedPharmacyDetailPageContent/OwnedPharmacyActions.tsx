'use client';

import { useEffect, useRef, useState } from 'react';
import { Ban, ChevronDown, ClipboardCheck, ShieldCheck } from 'lucide-react';

import type { MyPharmacyProfile } from '@e-pharmacy/types/pharmacies';
import { useToast } from '@e-pharmacy/ui/feedback';
import { InfoTooltip, ReasonModal } from '@e-pharmacy/ui/overlays';
import { Button } from '@e-pharmacy/ui/primitives';

import {
  deactivateOwnedPharmacy,
  getOwnedPharmacyDeactivationEligibility,
  sendOwnedPharmacyForVerification,
  submitOwnedPharmacyModeration,
} from '@/lib/api/browser/owned-pharmacy-editor.api';

import { getMyPharmacyOwnerDocuments } from '@/lib/api/browser';
import { getProfileErrorMessage } from '@/lib/errors/get-profile-error-message';
import { dispatchPharmacyCounterRefresh } from '@/lib/pharmacies/pharmacy-counter-refresh';

import {
  validatePharmacyEditor,
  effectivePharmacyEditorValues,
} from '../OwnedPharmacyEditor/pharmacy-editor-fields';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

type Action = 'verification' | 'moderation' | 'deactivate';

//===================================================================

export function OwnedPharmacyActions({
  pharmacy,
  onRefresh,
}: Readonly<{ pharmacy: MyPharmacyProfile; onRefresh: () => void }>) {
  const toast = useToast();
  const [action, setAction] = useState<Action | null>(null);
  const [comment, setComment] = useState('');
  const [requestError, setRequestError] = useState('');
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ownerHasDocuments, setOwnerHasDocuments] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  const [eligibility, setEligibility] = useState<{
    canDeactivate: boolean;
    reason: string;
    activeOrders: number;
    activeProductRequests: number;
  } | null>(null);

  const needsVerification =
    pharmacy.status === 'new' ||
    (pharmacy.status === 'on_verification' &&
      pharmacy.reviewState === 'changes_requested');

  const needsModeration =
    pharmacy.status === 'active' ||
    (pharmacy.status === 'on_moderation' &&
      pharmacy.reviewState === 'changes_requested');

  const canDeactivate =
    pharmacy.status === 'active' || pharmacy.status === 'on_moderation';

  const pending = pharmacy.pendingModeration;
  const hasChanges = Boolean(pending && Object.keys(pending).length);

  const documentsCount =
    pending?.documents?.length ?? pharmacy.documents.length;

  const invalid =
    Object.keys(
      validatePharmacyEditor(
        effectivePharmacyEditorValues(pharmacy),
        documentsCount,
        'verification'
      )
    ).length > 0;

  useEffect(() => {
    if (pharmacy.membershipRole !== 'owner' || !needsVerification) return;

    let active = true;

    void getMyPharmacyOwnerDocuments()
      .then((value) => {
        if (active) setOwnerHasDocuments(value.documents.length > 0);
      })

      .catch(() => {
        if (active) setOwnerHasDocuments(false);
      });

    return () => {
      active = false;
    };
  }, [needsVerification, pharmacy.membershipRole]);

  useEffect(() => {
    if (pharmacy.membershipRole !== 'owner' || !canDeactivate) return;

    const controller = new AbortController();

    void getOwnedPharmacyDeactivationEligibility(pharmacy.id, {
      signal: controller.signal,
    })
      .then((value) => {
        if (!controller.signal.aborted) setEligibility(value);
      })

      .catch(() => {
        if (!controller.signal.aborted) {
          setEligibility({
            canDeactivate: false,

            reason:
              'Could not verify whether orders and product requests are finished. Try refreshing the page.',

            activeOrders: 0,
            activeProductRequests: 0,
          });
        }
      });

    return () => controller.abort();
  }, [pharmacy.id, pharmacy.updatedAt, pharmacy.membershipRole, canDeactivate]);

  useEffect(() => {
    if (!menuOpen) return;

    const close = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) setMenuOpen(false);
    };

    document.addEventListener('pointerdown', close);

    return () => document.removeEventListener('pointerdown', close);
  }, [menuOpen]);

  const open = (next: Action) => {
    setAction(next);
    setMenuOpen(false);
    setComment('');
    setRequestError('');
  };

  const submit = async () => {
    if (!action || busy || !comment.trim()) return;

    setBusy(true);
    setRequestError('');

    try {
      if (action === 'verification') {
        await sendOwnedPharmacyForVerification(pharmacy.id, comment.trim());

        toast.success('Pharmacy sent for verification.');
      } else if (action === 'moderation') {
        await submitOwnedPharmacyModeration(pharmacy.id, {
          changes: {},
          expectedRevision: pharmacy.updatedAt,
          comment: comment.trim(),
        });

        toast.success('Pharmacy changes sent for moderation.');
      } else {
        await deactivateOwnedPharmacy(pharmacy.id, {
          expectedRevision: pharmacy.updatedAt,
          reason: comment.trim(),
        });

        toast.success('Pharmacy deactivated.');
      }

      setAction(null);
      dispatchPharmacyCounterRefresh();
      onRefresh();
    } catch (error) {
      setRequestError(
        getProfileErrorMessage(
          error,
          'Action could not be completed. Refresh pharmacy details and retry.'
        )
      );
    } finally {
      setBusy(false);
    }
  };

  if (pharmacy.membershipRole !== 'owner') return null;

  return (
    <>
      <div className={css.actions}>
        <div className={css.statusMenu} ref={menu}>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="owner-pharmacy-status-menu"
            iconLeft={<ClipboardCheck size={17} aria-hidden="true" />}
            onClick={() => setMenuOpen((previous) => !previous)}
          >
            Manage pharmacy status <ChevronDown size={16} aria-hidden="true" />
          </Button>
          {menuOpen ? (
            <div
              id="owner-pharmacy-status-menu"
              className={css.statusMenuOptions}
              role="menu"
              aria-label="Available pharmacy actions"
            >
              {needsVerification ? (
                <button
                  type="button"
                  role="menuitem"
                  className={css.approveAction}
                  disabled={invalid || !ownerHasDocuments}
                  title={
                    invalid || !ownerHasDocuments
                      ? 'Complete required fields and attach pharmacy and owner documents first.'
                      : undefined
                  }
                  onClick={() => open('verification')}
                >
                  <ClipboardCheck size={17} aria-hidden="true" />
                  Send for verification
                </button>
              ) : null}
              {needsModeration ? (
                <button
                  type="button"
                  role="menuitem"
                  className={css.approveAction}
                  disabled={invalid || !hasChanges}
                  title={
                    invalid || !hasChanges
                      ? 'Save valid changes before sending them for moderation.'
                      : undefined
                  }
                  onClick={() => open('moderation')}
                >
                  <ShieldCheck size={17} aria-hidden="true" />
                  Send for moderation
                </button>
              ) : null}
              {canDeactivate ? (
                <button
                  type="button"
                  role="menuitem"
                  className={css.dangerAction}
                  disabled={!eligibility?.canDeactivate}
                  title={
                    eligibility?.reason ??
                    'Checking unfinished orders and product requests'
                  }
                  onClick={() => open('deactivate')}
                >
                  <Ban size={17} aria-hidden="true" />
                  Deactivate pharmacy
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {canDeactivate && eligibility && !eligibility.canDeactivate ? (
          <InfoTooltip
            label="Why is deactivation unavailable?"
            title="Deactivation requirements"
            escapeOverflow
            items={[
              {
                title: 'Unfinished orders',
                description: `${eligibility.activeOrders} unfinished orders must be closed before deactivation.`,
                icon: <ClipboardCheck size={17} />,
              },
              {
                title: 'Product requests',
                description: `${eligibility.activeProductRequests} draft, new or in-progress product requests must be completed first.`,
                icon: <ShieldCheck size={17} />,
              },
            ]}
          />
        ) : null}
      </div>

      {action ? (
        <ReasonModal
          eyebrow="PHARMACY STATUS"
          title={
            action === 'deactivate'
              ? 'Deactivate pharmacy?'
              : action === 'verification'
                ? 'Send pharmacy for verification?'
                : 'Send changes for moderation?'
          }
          description={
            action === 'deactivate'
              ? 'The pharmacy will become unavailable. All unfinished orders and product requests must be closed first; this action and its reason are recorded in Activity history.'
              : 'Provide a short description for the administrator. Saved and submitted values will remain separate until a decision is made.'
          }
          value={comment}
          fieldName="pharmacyOwnerActionDescription"
          fieldLabel="Short description for the administrator"
          placeholder="Briefly describe the reason or submitted changes..."
          confirmLabel={
            action === 'deactivate'
              ? 'Deactivate pharmacy'
              : action === 'verification'
                ? 'Send for verification'
                : 'Send for moderation'
          }
          cancelLabel="Cancel"
          maxLength={500}
          error={comment.trim() ? '' : 'Short description is required.'}
          requestError={requestError}
          tone={action === 'deactivate' ? 'danger' : 'accent'}
          isLoading={busy}
          onValueChange={setComment}
          onCancel={() => setAction(null)}
          onConfirm={() => void submit()}
        />
      ) : null}
    </>
  );
}
