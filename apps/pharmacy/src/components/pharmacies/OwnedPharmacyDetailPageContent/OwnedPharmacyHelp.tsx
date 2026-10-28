'use client';

import { useEffect, useState } from 'react';

import {
  CircleHelp,
  ClipboardCheck,
  FileCheck2,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';

import type { MyPharmacyProfile } from '@e-pharmacy/types/pharmacies';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';

import { getOwnedPharmacyDeactivationEligibility } from '@/lib/api/browser/owned-pharmacy-editor.api';

//===================================================================

type Eligibility = Readonly<{
  activeOrders: number;
  activeProductRequests: number;
}>;

//===================================================================

/** Human-facing instructions, separate from the technical tab architecture. */
export function OwnedPharmacyHelp({
  pharmacy,
}: Readonly<{ pharmacy: MyPharmacyProfile }>) {
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);

  useEffect(() => {
    if (pharmacy.membershipRole !== 'owner') return;

    const controller = new AbortController();

    void getOwnedPharmacyDeactivationEligibility(pharmacy.id, {
      signal: controller.signal,
    })
      .then((value) => {
        if (!controller.signal.aborted) setEligibility(value);
      })

      .catch(() => {
        if (!controller.signal.aborted) setEligibility(null);
      });

    return () => controller.abort();
  }, [pharmacy.id, pharmacy.updatedAt, pharmacy.membershipRole]);

  const orderCount = eligibility
    ? `${eligibility.activeOrders} unfinished orders. `
    : '';

  const requestCount = eligibility
    ? `${eligibility.activeProductRequests} unfinished product requests. `
    : '';

  return (
    <InfoTooltip
      label="How to manage this pharmacy"
      title="Managing your pharmacy"
      icon={<CircleHelp size={20} aria-hidden="true" />}
      escapeOverflow
      scrollable
      items={[
        {
          title: 'Send for verification',
          description:
            'Complete every required field and upload the required pharmacy and owner documents. You can then submit the pharmacy for its initial review.',
          icon: <FileCheck2 size={17} />,
        },
        {
          title: 'Send for moderation',
          description:
            'First save changes to your pharmacy details and complete every required field. The submission option becomes available when there are saved changes ready for review.',
          icon: <ShieldCheck size={17} />,
        },
        {
          title: 'What clients can see',
          description:
            'Saving or submitting changes does not publish them immediately. Until an administrator approves the changes, clients continue to see the previously approved pharmacy information.',
          icon: <ClipboardCheck size={17} />,
        },
        {
          title: 'Unfinished orders',
          description: `${orderCount}Orders with the statuses New or In Progress must be completed before you can deactivate the pharmacy.`,
          icon: <ShoppingBag size={17} />,
        },
        {
          title: 'Unfinished product requests',
          description: `${requestCount}Product requests with the statuses Draft, New or In Progress must be completed before deactivation.`,
          icon: <ClipboardCheck size={17} />,
        },
      ]}
    />
  );
}
