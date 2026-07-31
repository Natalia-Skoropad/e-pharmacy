import { ROUTES } from '@/lib/routes';

import type { InfoPageData } from './types';

//===================================================================

export const PERSONAL_DATA_NOTICE_INFO = {
  path: ROUTES.PERSONAL_DATA_NOTICE,
  title: 'Personal Data Processing Notice',

  description:
    'This notice explains what personal data E-PHARMACY may process, why it is needed, and how users can manage their rights.',

  metadata: {
    version: 'draft-2026-05',
    effectiveAt: null,
    updatedAt: {
      iso: '2026-05',
      label: 'May 2026',
    },

    contentOwner: null,
    approvalStatus: 'unreviewed',
    legalEntity: null,
    supportRoute: null,
    reviewId: null,
  },

  sections: [
    {
      id: 'data-controller',
      title: 'Who controls personal data',
      content: [
        'E-PHARMACY processes personal data needed to provide client account features, cart features, checkout, order history, and communication related to orders.',
        'Partner pharmacies may also process client data when they receive an order request or provide products and services to the client.',
      ],
    },
    {
      id: 'processed-data',
      title: 'Personal data that may be processed',
      content: [
        'The platform may process name, email, phone number, delivery address or post office details, account photo, favorite items, cart items, order details, and technical data required for security and platform operation.',
        'The platform does not ask users to provide unnecessary sensitive information for ordinary shopping flow.',
      ],
    },
    {
      id: 'processing-purposes',
      title: 'Why data is processed',
      content: [
        'Personal data is used to create and protect accounts, save profile details, prepare orders, show order history, manage favorites, contact the client about an order, and improve platform reliability.',
        'Technical data can also be used to prevent abuse, protect sessions, and keep the service stable.',
      ],
    },
    {
      id: 'pharmacy-data-sharing',
      title: 'Sharing with partner pharmacies',
      content: [
        'When a client confirms an order, the information required to process that order may be shared with the selected pharmacy.',
        'The pharmacy receives only the data needed for order preparation, confirmation, pickup, delivery, payment, or client communication.',
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies and similar technologies',
      content: [
        'The platform may use cookies or similar technologies to keep users signed in, remember interface choices, protect sessions, and understand basic platform performance.',
        'Users can manage cookies in their browser settings, but disabling some cookies may affect account and checkout functionality.',
      ],
    },
    {
      id: 'data-storage-period',
      title: 'Storage period',
      content: [
        'Personal data is stored only for as long as needed for the purpose for which it was collected, unless a longer period is required by law or needed to protect legal interests.',
        'Account data can be updated by the user in the profile section where supported by the platform.',
      ],
    },
    {
      id: 'user-rights',
      title: 'User rights',
      content: [
        'Users may request access to their personal data, correction of inaccurate information, deletion where applicable, restriction of processing, or additional information about processing.',
        'A request should clearly identify the account or order involved so the platform can review it accurately.',
      ],
    },
    {
      id: 'data-security',
      title: 'Security',
      content: [
        'E-PHARMACY uses technical and organizational measures intended to protect account and order data from unauthorized access, loss, or misuse.',
        'Users should also protect their passwords and avoid sharing account access with other people.',
      ],
    },
  ],
} as const satisfies InfoPageData;
