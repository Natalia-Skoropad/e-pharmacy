import type { ManagedPhotoSize } from './managed-photo-url';

//===================================================================

// Shared rendering contract for all three applications. The variant is the
// stored source derivative, while `sizes` is the rendered CSS width (not DPR).
// Next/Image chooses an appropriate DPR-aware srcset candidate from `sizes`.
export const PHOTO_PRESETS = {
  table: {
    mediaSize: 'thumb',
    sizes: '48px',
  },

  search: {
    mediaSize: 'thumb',
    sizes: '64px',
  },

  compact: {
    mediaSize: 'medium',
    sizes: '(max-width: 767px) 108px, 180px',
  },

  panel: {
    mediaSize: 'medium',
    sizes: '(max-width: 767px) 90vw, 400px',
  },

  card: {
    mediaSize: 'medium',
    sizes:
      '(max-width: 374px) calc(100vw - 40px), (max-width: 767px) 335px, (max-width: 1439px) 340px, 422px',
  },

  offer: {
    mediaSize: 'medium',
    sizes:
      '(max-width: 374px) calc(100vw - 80px), (max-width: 767px) 295px, (max-width: 1439px) 322px, 380px',
  },

  detail: {
    mediaSize: 'large',
    sizes:
      '(max-width: 767px) calc(100vw - 32px), (max-width: 1439px) 704px, 720px',
  },

  hero: {
    mediaSize: 'large',
    sizes:
      '(max-width: 374px) calc(100vw - 40px), (max-width: 767px) 335px, (max-width: 1439px) 704px, 520px',
  },
} as const satisfies Record<
  string,
  { mediaSize: ManagedPhotoSize; sizes: string }
>;

//===================================================================

export type PhotoPreset = keyof typeof PHOTO_PRESETS;
