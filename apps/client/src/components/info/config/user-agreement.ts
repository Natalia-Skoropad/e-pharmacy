import { ROUTES } from '@/lib/routes';

import type { InfoPageData } from './types';

//===================================================================

export const USER_AGREEMENT_INFO = {
  path: ROUTES.USER_AGREEMENT,
  title: 'User Agreement',

  description:
    'These terms explain how clients may use E-PHARMACY, what the platform provides, and which responsibilities belong to users and partner pharmacies.',

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
      id: 'general-terms',
      title: 'General terms',
      content: [
        'This User Agreement applies to the E-PHARMACY website and related client services. By using the platform, the user confirms that they have read and accepted these terms.',
        'If the user does not agree with the terms, the user should not use the platform or create an account.',
      ],
    },
    {
      id: 'platform-purpose',
      title: 'Purpose of the platform',
      content: [
        'E-PHARMACY is an information and order-preparation service. It helps users search for products, view pharmacy information, compare offers, add products to cart, and prepare checkout details.',
        'The platform is not a medical consultation service and does not replace professional advice from a doctor or pharmacist.',
      ],
    },
    {
      id: 'partner-pharmacies',
      title: 'Partner pharmacies',
      content: [
        'Products, prices, availability, working hours, payment details, and delivery conditions are provided by partner pharmacies or generated from their available data.',
        'Partner pharmacies may update their information, confirm or reject orders, and set their own service conditions according to their licenses and internal rules.',
      ],
    },
    {
      id: 'user-account',
      title: 'User account',
      content: [
        'A user may create an account to manage profile information, favorite products, favorite pharmacies, cart items, and order history.',
        'The user is responsible for keeping login details secure and for providing accurate contact information during checkout.',
      ],
    },
    {
      id: 'order-requests',
      title: 'Orders and checkout',
      content: [
        'An order created through E-PHARMACY is a request sent to the selected pharmacy. The final purchase is completed between the client and the pharmacy that supplies the product.',
        'The client should check product names, quantities, pharmacy address, delivery method, payment method, and contact details before confirming an order.',
      ],
    },
    {
      id: 'liability-limitations',
      title: 'Limitations of liability',
      content: [
        'E-PHARMACY works to keep the platform clear, stable, and helpful, but cannot guarantee that every product or price will remain unchanged at the moment of pharmacy confirmation.',
        'The platform is not responsible for medical decisions made by users. Clients should follow prescriptions, product instructions, and professional recommendations.',
      ],
    },
    {
      id: 'agreement-updates',
      title: 'Updates to the agreement',
      content: [
        'E-PHARMACY may update this agreement to reflect platform changes, legal requirements, or service improvements.',
        'The current version is published on this page. Continued use of the platform after updates means the user accepts the new version.',
      ],
    },
  ],
} as const satisfies InfoPageData;
