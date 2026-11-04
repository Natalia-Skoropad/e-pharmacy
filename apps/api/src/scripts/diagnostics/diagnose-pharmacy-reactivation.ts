import dotenv from 'dotenv';
import mongoose, { Types } from 'mongoose';
import { performance } from 'node:perf_hooks';

import { Pharmacy } from '../../models/pharmacies/pharmacy.model';
import { ProductOffer } from '../../models/inventory/productOffer.model';
import { User } from '../../models/accounts/user.model';

import { getPharmacySearchOptionsService } from '../../services/pharmacies/pharmacy-search-options.service';
import { PUBLIC_PHARMACY_STATUS_FILTER } from '../../services/pharmacies/pharmacy-public-status';

import {
  getPharmaciesService,
  getPharmacyDetailsService,
} from '../../services/pharmacies/pharmacy-public-catalog.service';

//===================================================================

// Read-only. Never log credentials, contacts, document content, or audit payloads.
// Run from apps/api with MONGODB_URI in .env:
// pnpm diagnose:pharmacy-reactivation <pharmacyId> [status|page1|page2|selected|option|detail|search]

const supportedModes = [
  'status',
  'page1',
  'page2',
  'selected',
  'option',
  'detail',
  'search',
] as const;

//===================================================================

type Mode = (typeof supportedModes)[number];

//===================================================================

async function main(): Promise<void> {
  const [pharmacyId, requestedMode = 'status', ...extras] =
    process.argv.slice(2);
  if (
    !pharmacyId ||
    !/^[0-9a-f]{24}$/i.test(pharmacyId) ||
    extras.length > 0 ||
    !supportedModes.includes(requestedMode as Mode)
  ) {
    throw new Error(
      'Usage: pnpm diagnose:pharmacy-reactivation <24-char-id> ' +
        '[status|page1|page2|selected|option|detail|search]'
    );
  }

  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) throw new Error('MONGODB_URI is required');

  const mode = requestedMode as Mode;

  await mongoose.connect(uri, {
    autoIndex: false,
    autoCreate: false,
    serverSelectionTimeoutMS: 10_000,
  });

  try {
    const id = new Types.ObjectId(pharmacyId);
    const startedAt = performance.now();

    let result: Record<string, unknown>;

    if (mode === 'status') {
      const record = await Pharmacy.findById(id)
        .select(
          'status reviewState blockSource statusReason pendingModeration approvedAt activatedAt'
        )
        .lean();

      if (!record) {
        result = { exists: false };
      } else {
        const [publiclyVisible, defaultClient, availableOffers] =
          await Promise.all([
            Pharmacy.exists({ _id: id, status: PUBLIC_PHARMACY_STATUS_FILTER }),

            User.exists({
              defaultClientPharmacyId: id,
              isDefaultPharmacyClient: true,
            }),

            ProductOffer.countDocuments({
              pharmacyId: id,
              availableQuantity: { $gt: 0 },
            }),
          ]);

        result = {
          exists: true,
          status: record.status,
          reviewState: record.reviewState ?? null,
          hasBlockSource: Boolean(record.blockSource),
          hasStatusReason: Boolean(record.statusReason),
          hasPendingModeration: Boolean(record.pendingModeration),
          hasApprovedAt: Boolean(record.approvedAt),
          hasActivatedAt: Boolean(record.activatedAt),
          publiclyVisible: Boolean(publiclyVisible),
          hasDefaultClient: Boolean(defaultClient),
          availableOffers,

          // An approved reactivation should publish the reviewed data, clear
          // review/block flags, and be immediately accessible to public reads.
          activationLooksConsistent:
            record.status === 'active' &&
            !record.reviewState &&
            !record.blockSource &&
            !record.statusReason &&
            !record.pendingModeration &&
            Boolean(record.approvedAt) &&
            Boolean(record.activatedAt) &&
            Boolean(publiclyVisible),
        };
      }
    } else if (mode === 'option') {
      const response = await getPharmacySearchOptionsService({
        kind: 'pharmacy',
        page: 1,
        perPage: 1,
        selectedId: pharmacyId,
      });

      result = {
        found: response.items.some(
          (item) => 'id' in item && item.id === pharmacyId
        ),
        total: response.total,
      };
    } else if (mode === 'search') {
      const pharmacy = await Pharmacy.findById(id).select('name').lean();

      if (!pharmacy) {
        result = { exists: false };
      } else {
        const response = await getPharmacySearchOptionsService({
          kind: 'pharmacy',
          page: 1,
          perPage: 50,
          query: pharmacy.name,
        });

        result = {
          exists: true,

          foundInSearch: response.items.some(
            (item) => 'id' in item && item.id === pharmacyId
          ),

          total: response.total,
          returned: response.items.length,
        };
      }
    } else if (mode === 'detail') {
      const response = await getPharmacyDetailsService(pharmacyId);

      result = {
        found: Boolean(response.pharmacy),
        availableProductsCount: response.pharmacy.availableProductsCount,
      };
    } else {
      const page = mode === 'page2' ? 2 : 1;

      const response = await getPharmaciesService({
        page,
        perPage: 24,
        sort: 'newest',
        ...(mode === 'selected' ? { pharmacyId } : {}),
      });

      result = {
        page,
        total: response.total,
        returned: response.items.length,

        containsTarget: response.items.some(
          (item) => 'id' in item && item.id === pharmacyId
        ),

        targetAvailableProductsCount:
          response.items.find((item) => item.id === pharmacyId)
            ?.availableProductsCount ?? null,
      };
    }

    console.log(
      JSON.stringify(
        {
          mode: 'read-only',
          scenario: requestedMode,
          durationMs: Math.round(performance.now() - startedAt),
          ...result,
        },
        null,
        2
      )
    );
  } finally {
    await mongoose.disconnect();
  }
}

//===================================================================

dotenv.config();

//===================================================================

void main().catch((error: unknown) => {
  // A concise type-only failure avoids leaking database URI or private data.
  const failure = error as {
    name?: string;
    code?: string | number;
    status?: number;
  };

  console.error(
    JSON.stringify({
      diagnostic: 'failed',
      type: failure.name ?? 'Error',
      code: failure.code ?? null,
      httpStatus: failure.status ?? null,
    })
  );

  process.exitCode = 1;
});
