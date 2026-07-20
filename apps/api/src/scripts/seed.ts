import mongoose, { Types } from 'mongoose';

import { connectDB } from '../db/connectDB';

import {
  PHARMACY_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from '../constants/auth';

import { Product } from '../models/product.model';
import { Pharmacy } from '../models/pharmacy.model';
import { User } from '../models/user.model';
import { ProductOffer } from '../models/productOffer.model';
import { ProductReview } from '../models/productReview.model';
import { PharmacyReview } from '../models/pharmacyReview.model';
import { Order } from '../models/order.model';
import { Client } from '../models/client.model';
import { Cart } from '../models/cart.model';
import { StockMovement } from '../models/stockMovement.model';
import { PharmacyNote } from '../models/pharmacyNote.model';
import { ProductRequest } from '../models/productRequest.model';
import { hashPassword } from '../utils/password';
import { ensureDefaultPharmacyClient } from '../services/default-pharmacy-client.service';
import type { PharmacyEntity } from '../types/pharmacy';
import type { ProductEntity } from '../types/product';

//===============================================================

const STOCK_MOVEMENT_DEMO_PRODUCT_ID = new Types.ObjectId(
  '6a4fc8b1e78e187afe81fd99'
);

//===============================================================

const STOCK_MOVEMENT_DEMO_CLIENT_EMAIL = 'nataa@ukr.net';
const STOCK_MOVEMENT_DEMO_ORDER_PRICE = 1968;
const STOCK_MOVEMENT_DEMO_CURRENT_PRICE = 2010;

//===============================================================

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

//===============================================================

function createSeedOrderNumber(
  orderId: Types.ObjectId,
  createdAt: Date
): string {
  const datePart = [
    createdAt.getUTCFullYear(),
    padDatePart(createdAt.getUTCMonth() + 1),
    padDatePart(createdAt.getUTCDate()),
  ].join('');

  const timePart = [
    padDatePart(createdAt.getUTCHours()),
    padDatePart(createdAt.getUTCMinutes()),
    padDatePart(createdAt.getUTCSeconds()),
  ].join('');

  return `EP-${datePart}-${timePart}-${orderId
    .toString()
    .slice(-8)
    .toUpperCase()}`;
}

//===============================================================

const REVIEW_AUTHORS = [
  'Natalia',
  'Olena',
  'Iryna',
  'Andrii',
  'Maksym',
  'Sofia',
  'Dmytro',
  'Kateryna',
  'Yuliia',
  'Roman',
  'Anna',
  'Viktor',
  'Maria',
  'Taras',
  'Nina',
];

//===============================================================

const REVIEW_COMMENTS = [
  'The order was processed quickly, the product page had clear details, and the pharmacy staff explained the pickup process very politely. I liked that the information about availability matched the real stock, so there were no surprises when I arrived. Packaging was neat, the receipt was ready, and the overall experience felt reliable. This is exactly the kind of service I want to see in an online pharmacy catalog when comparing offers, prices, and nearby pharmacies before making a purchase.',
  'I was checking several options and this one looked the most convenient because the description, price, rating, and pharmacy information were easy to understand. The product was prepared on time, the staff answered my questions calmly, and the checkout flow felt simple. Long reviews like this are helpful for testing the layout too: the card should stay readable, the spacing should not collapse, and the text should wrap naturally without breaking the design on mobile, tablet, or desktop screens.',
  'Very good experience from search to pickup. The catalog helped me compare similar products, the rating looked realistic, and the pharmacy page showed useful address and phone details. The item was available exactly as shown, which is important when someone needs products quickly. I also liked that the review section is not too cramped, because longer feedback gives more context and makes the interface feel closer to a real marketplace with many active clients.',
  'The product name, package size, and price were clear, and the pharmacy had enough stock when I came to collect the order. I usually pay attention to reviews before choosing a pharmacy, so it is useful to see detailed feedback instead of one short sentence. This comment intentionally has many words to check how five hundred character reviews behave inside cards, lists, tabs, lazy loading blocks, and responsive layouts without creating awkward gaps or visual noise.',
];

//===============================================================

const CITIES = [
  'Kyiv',
  'Lviv',
  'Odesa',
  'Dnipro',
  'Kharkiv',
  'Vinnytsia',
  'Chernihiv',
  'Poltava',
  'Rivne',
  'Ternopil',
  'Ivano-Frankivsk',
  'Uzhhorod',
  'Cherkasy',
  'Zhytomyr',
];

//===============================================================

const PHARMACY_BRANDS = [
  'DobroMed Pharmacy',
  'Apteka Zdorovia',
  'Family Health Pharmacy',
  'CityMed Pharmacy',
  'MedService 24',
  'VitaLine Pharmacy',
  'Pulse Pharmacy',
  'CarePoint Pharmacy',
  'Health Bridge Pharmacy',
  'Nova Apteka',
  'Wellness Hub Pharmacy',
  'MedComfort Pharmacy',
  'PharmaPlus',
  'Daily Care Pharmacy',
  'SafeDose Pharmacy',
  'Pharmacy Near You',
];

//===============================================================

const STREETS = [
  'Central Street',
  'Soborna Avenue',
  'Shevchenka Street',
  'Independence Avenue',
  'Peace Street',
  'European Square',
  'Medical Lane',
  'Hospitalna Street',
  'University Avenue',
  'Green Boulevard',
];

//===============================================================

const PRODUCT_BLUEPRINTS = [
  [
    'Aspirin',
    'medicine',
    'Square',
    '500 mg',
    '№30 (10x3)',
    '/images/seed/products/product-001.png',
  ],
  [
    'Paracetamol',
    'medicine',
    'Acme',
    '500 mg',
    '№20 (10x2)',
    '/images/seed/products/product-002.png',
  ],
  [
    'Ibuprofen',
    'medicine',
    'Beximco',
    '200 mg',
    '№28 (14x2)',
    '/images/seed/products/product-003.png',
  ],
  [
    'Acetaminophen',
    'hygiene',
    'ACI',
    '500 mg',
    '№10',
    '/images/seed/products/product-004.png',
  ],
  [
    'Naproxen',
    'beauty',
    'Uniliver',
    '250 mg',
    '№60',
    '/images/seed/products/product-005.png',
  ],
  [
    'Loratadine',
    'medicine',
    'Square',
    '10 mg',
    '№100',
    '/images/seed/products/product-006.png',
  ],
  [
    'Atorvastatin',
    'medicine',
    'Acme',
    '20 mg',
    '№30 (10x3)',
    '/images/seed/products/product-007.png',
  ],
  [
    'Omeprazole',
    'medicine',
    'Beximco',
    '20 mg',
    '№20 (10x2)',
    '/images/seed/products/product-008.png',
  ],
  [
    'Simvastatin',
    'hygiene',
    'ACI',
    '20 mg',
    '№28 (14x2)',
    '/images/seed/products/product-009.png',
  ],
  [
    'Metformin',
    'beauty',
    'Uniliver',
    '500 mg',
    '№10',
    '/images/seed/products/product-010.png',
  ],
  [
    'Warfarin',
    'medicine',
    'Square',
    '5 mg',
    '№60',
    '/images/seed/products/product-011.png',
  ],
  [
    'Fluoxetine',
    'medicine',
    'Acme',
    '20 mg',
    '№100',
    '/images/seed/products/product-012.png',
  ],
  [
    'Lisinopril',
    'medicine',
    'Beximco',
    '10 mg',
    '№30 (10x3)',
    '/images/seed/products/product-013.png',
  ],
  [
    'Metoprolol',
    'hygiene',
    'ACI',
    '50 mg',
    '№20 (10x2)',
    '/images/seed/products/product-014.png',
  ],
  [
    'Amlodipine',
    'beauty',
    'Uniliver',
    '5 mg',
    '№28 (14x2)',
    '/images/seed/products/product-015.png',
  ],
  [
    'Citalopram',
    'medicine',
    'Square',
    '20 mg',
    '№10',
    '/images/seed/products/product-016.png',
  ],
  [
    'Metronidazole',
    'medicine',
    'Acme',
    '500 mg',
    '№60',
    '/images/seed/products/product-017.png',
  ],
  [
    'Carvedilol',
    'medicine',
    'Beximco',
    '12.5 mg',
    '№100',
    '/images/seed/products/product-018.png',
  ],
  [
    'Clopidogrel',
    'hygiene',
    'ACI',
    '75 mg',
    '№30 (10x3)',
    '/images/seed/products/product-019.png',
  ],
  [
    'Levothyroxine',
    'beauty',
    'Uniliver',
    '50 mcg',
    '№20 (10x2)',
    '/images/seed/products/product-020.png',
  ],
  [
    'Ramipril',
    'medicine',
    'Square',
    '5 mg',
    '№28 (14x2)',
    '/images/seed/products/product-021.png',
  ],
  [
    'Amitriptyline',
    'medicine',
    'Acme',
    '25 mg',
    '№10',
    '/images/seed/products/product-022.png',
  ],
  [
    'Losartan',
    'medicine',
    'Beximco',
    '50 mg',
    '№60',
    '/images/seed/products/product-023.png',
  ],
  [
    'Montelukast',
    'hygiene',
    'ACI',
    '10 mg',
    '№100',
    '/images/seed/products/product-024.png',
  ],
  [
    'Hydrochlorothiazide',
    'beauty',
    'Uniliver',
    '25 mg',
    '№30 (10x3)',
    '/images/seed/products/product-025.png',
  ],
  [
    'Meloxicam',
    'medicine',
    'Square',
    '15 mg',
    '№20 (10x2)',
    '/images/seed/products/product-026.png',
  ],
  [
    'Amlodipine',
    'medicine',
    'Acme',
    '5 mg',
    '№28 (14x2)',
    '/images/seed/products/product-027.png',
  ],
  [
    'Citalopram',
    'medicine',
    'Beximco',
    '20 mg',
    '№10',
    '/images/seed/products/product-028.png',
  ],
  [
    'Atorvastatin',
    'hygiene',
    'ACI',
    '20 mg',
    '№60',
    '/images/seed/products/product-029.png',
  ],
  [
    'Warfarin',
    'beauty',
    'Uniliver',
    '5 mg',
    '№100',
    '/images/seed/products/product-030.png',
  ],
] as const;

//===============================================================

type SeedPharmacyDocument = {
  _id: Types.ObjectId;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  rating?: number;
  imageUrl?: string;
  bankDetails?: {
    recipientName: string;
    taxId: string;
    iban: string;
    bankName: string;
    receiptEmail?: string;
    paymentPurpose: string;
  };
};

//===============================================================

const PHARMACY_IMAGE_URLS = [
  '/images/seed/pharmacies/pharmacy-001.png',
  '/images/seed/pharmacies/pharmacy-002.png',
  '/images/seed/pharmacies/pharmacy-003.png',
  '/images/seed/pharmacies/pharmacy-004.png',
  '/images/seed/pharmacies/pharmacy-005.png',
  '/images/seed/pharmacies/pharmacy-006.png',
  '/images/seed/pharmacies/pharmacy-007.png',
  '/images/seed/pharmacies/pharmacy-008.png',
  '/images/seed/pharmacies/pharmacy-009.png',
  '/images/seed/pharmacies/pharmacy-010.png',
  '/images/seed/pharmacies/pharmacy-011.png',
  '/images/seed/pharmacies/pharmacy-012.png',
  '/images/seed/pharmacies/pharmacy-013.png',
  '/images/seed/pharmacies/pharmacy-014.png',
  '/images/seed/pharmacies/pharmacy-015.png',
  '/images/seed/pharmacies/pharmacy-016.png',
  '/images/seed/pharmacies/pharmacy-017.png',
  '/images/seed/pharmacies/pharmacy-018.png',
  '/images/seed/pharmacies/pharmacy-019.png',
  '/images/seed/pharmacies/pharmacy-020.png',
] as const;

//===============================================================

function createPharmacyImageUrl(index: number): string {
  return PHARMACY_IMAGE_URLS[index % PHARMACY_IMAGE_URLS.length];
}

//===============================================================

function createProductName(
  baseName: string,
  manufacturer: string,
  dosage?: string,
  packageQuantity?: string,
  variantIndex = 0
): string {
  const safeDosage = dosage ?? '20 mg';
  const safePackageQuantity = packageQuantity ?? '№30';
  const normalizedManufacturer = manufacturer.replace(/\s+/g, '-');

  const variants = [
    baseName,
    `${baseName} ${safeDosage} ${safePackageQuantity}`,
    `${baseName}-${normalizedManufacturer}`,
    `${baseName} ${safeDosage} ${normalizedManufacturer}`,
    `${baseName} Max ${safeDosage} №60`,
  ];

  return variants[variantIndex % variants.length];
}

//===============================================================

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

//===============================================================

function createModeratedReview(index: number, preferredRating?: number) {
  return {
    userName: REVIEW_AUTHORS[index % REVIEW_AUTHORS.length],
    rating: preferredRating ?? (index % 5) + 1,
    comment: REVIEW_COMMENTS[index % REVIEW_COMMENTS.length],
    status: 'approved' as const,
    moderatedAt: new Date(
      `2026-04-${String(1 + (index % 25)).padStart(2, '0')}T10:00:00.000Z`
    ),
    createdAt: new Date(
      `2026-04-${String(1 + (index % 25)).padStart(2, '0')}T09:00:00.000Z`
    ),
  };
}

//===============================================================

function createModeratedReviews(count: number, ratingBase = 4) {
  return Array.from({ length: count }, (_, index) =>
    createModeratedReview(index, Math.min(5, ratingBase + (index % 2)))
  );
}

//===============================================================

function createOffer(
  pharmacy: SeedPharmacyDocument,
  price: number,
  totalQuantity: number
) {
  const reservedQuantity = 0;
  const availableQuantity = totalQuantity;

  return {
    pharmacyId: pharmacy._id,
    pharmacyName: pharmacy.name,
    pharmacyCity: pharmacy.city,
    pharmacyAddress: pharmacy.address,
    pharmacyPhone: pharmacy.phone,
    pharmacyImageUrl: pharmacy.imageUrl,
    pharmacyRating: pharmacy.rating,
    pharmacyReviewsCount: 18 + (price % 17),
    price,
    totalQuantity,
    availableQuantity,
    reservedQuantity,
  };
}

//===============================================================

function createBankDetails(pharmacyName: string, pharmacyNumber: number) {
  const taxId = String(30000000 + pharmacyNumber).padStart(8, '0');
  const ibanTail = `300001${String(pharmacyNumber).padStart(21, '0')}`;

  return {
    recipientName: `LLC ${pharmacyName}`,
    taxId,
    iban: `UA${ibanTail}`,
    bankName: pharmacyNumber % 2 === 0 ? 'JSC PrivatBank' : 'JSC Oschadbank',
    paymentPurpose: `Payment for E-PHARMACY order from ${pharmacyName}`,
  };
}

//===============================================================

const PHARMACY_ACCOUNT_PASSWORD = '123456789';
const ACTIVE_PHARMACY_FIRST_ACTIVATED_AT = new Date(
  '2026-06-18T09:00:00.000Z'
);
const PHARMACY_ACCOUNT_DESCRIPTION_LENGTH = 5000;

const PHARMACY_ACCOUNT_FALLBACK_IMAGE_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p94AAAAASUVORK5CYII=';

//===============================================================

type PharmacyAccountSeed = {
  email: string;
  phone: string;
  ownerName: string;
  address: string;
  pharmacyName: string;

  status:
    | typeof PHARMACY_STATUSES.NEW
    | typeof PHARMACY_STATUSES.ON_VERIFICATION
    | typeof PHARMACY_STATUSES.ACTIVE;

  statusReason?: string;
  imageUrl?: string;
  publicEmail?: string;
  workingHours?: string;
  description?: string;
};

//===============================================================

const PHARMACY_ACCOUNT_SEEDS: PharmacyAccountSeed[] = [
  {
    email: 'nata5@ukr.net',
    phone: '+380661234005',
    ownerName: 'Nata Five',
    address: '25 Health Avenue, Kyiv',
    pharmacyName: 'Nata Care Pharmacy New',
    status: PHARMACY_STATUSES.NEW,
    statusReason:
      'Admin returned the profile to New status: please upload a clearer pharmacy photo, check the license document scan, and update working hours before sending the profile again.',
  },
  {
    email: 'nata6@ukr.net',
    publicEmail: 'care_pharmacy@ukr.net',
    phone: '+380661234777',
    ownerName: 'Nata Six',
    address: '777 Wellness Street, Lviv',
    pharmacyName: 'Care Pharmacy Lviv',
    status: PHARMACY_STATUSES.ACTIVE,
    imageUrl: '/images/seed/pharmacies/pharmacy-021.png',
    workingHours:
      'Mon: 09:00-18:00; Tue: 09:00-18:00; Wed: 09:00-18:00; Thu: 09:00-18:00; Fri: 09:00-18:00; Sat: 10:00-17:00; Sun: Closed',
    description: createActivePharmacyDescription('Care Pharmacy Lviv'),
  },
];

//===============================================================

function createExactLengthText(source: string, targetLength: number): string {
  const filler = `

**Service checklist**
- Online product reservation with clear pickup instructions.
- Friendly consultation at the pharmacy counter.
- Verified documents, payment details, and contact channels.
- Updated working hours and support for regular clients.`;

  let result = source.trim();

  while (result.length < targetLength) {
    result += filler;
  }

  const sliced = result.slice(0, targetLength);

  return /\s$/.test(sliced) ? `${sliced.slice(0, -1)}.` : sliced;
}

//===============================================================

function createPharmacyAccountDescription(pharmacyName: string): string {
  return createExactLengthText(
    `**${pharmacyName}**

${pharmacyName} is a complete demo pharmacy profile prepared for checking the pharmacy cabinet, profile forms, validation rules, and the send-for-verification flow. The description intentionally uses a long structured text so the editor can be tested with realistic content length, paragraphs, bold headings, and lists.

**About the pharmacy**
The pharmacy focuses on everyday medicines, vitamins, hygiene products, medical devices, and clear client communication. The team keeps contact data, payment details, documents, and public information filled in so the profile behaves like a real business account during manual testing.

**What clients can expect**
- Accurate product availability information.
- Polite consultation before pickup.
- Clear working hours and phone support.
- Careful handling of orders and reservation requests.
- Transparent payment details for online orders.

**Operational standards**
The pharmacy profile contains realistic bank details, address, phone number, email, working hours, uploaded verification documents, and a public image placeholder. This makes the New account ready for resubmission after Admin feedback while the second account demonstrates the newly activated pharmacy state.

**Quality notes**
- The profile is suitable for testing empty and filled sections.
- The text contains multiple paragraphs for layout checks.
- Markdown-style bold headings and lists are included.
- The total description length is exactly five thousand characters.`,
    PHARMACY_ACCOUNT_DESCRIPTION_LENGTH
  );
}

//===============================================================

function createActivePharmacyDescription(pharmacyName: string): string {
  return `**Operational standards**

${pharmacyName} keeps public pharmacy data ready for clients after Admin approval. The profile shows updated contact details, payment information, documents, working hours, and a public pharmacy photo.

**Quality notes**
- The pharmacy profile is active and visible on the website.
- Clients can see approved public information while new changes wait for moderation.
- Product stock, prices, and availability can be managed in the pharmacy cabinet.
- Orders can be created for products with available quantity.

**Service checklist**
- Online product reservation with clear pickup instructions.
- Friendly consultation at the pharmacy counter.
- Verified documents, payment details, and contact channels.
- Updated working hours and support for regular clients.`;
}

//===============================================================

function createVerificationDocuments(email: string) {
  const prefix = email.split('@')[0];

  return [
    {
      name: `${prefix}-license.pdf`,
      size: 186_420,
      type: 'application/pdf',
    },
    {
      name: `${prefix}-registration-certificate.pdf`,
      size: 214_880,
      type: 'application/pdf',
    },
    {
      name: `${prefix}-tax-details.pdf`,
      size: 156_320,
      type: 'application/pdf',
    },
  ];
}

//===============================================================

function createPharmacyAccountBankDetails(seed: PharmacyAccountSeed) {
  if (seed.email === 'nata6@ukr.net') {
    return {
      recipientName: 'LLC Care Pharmacy Lviv',
      taxId: '30000777',
      iban: 'UA300001000000000000000000777',
      bankName: 'JSC Oschadbank Lviv',
      receiptEmail: 'care_pharmacy_lviv@ukr.net',
      paymentPurpose: 'Payment for E-PHARMACY orders from Care Pharmacy Lviv',
    };
  }

  const accountNumber = Number(seed.email.match(/nata(\d+)/)?.[1] ?? 6);
  const ibanTail = `300001${String(accountNumber).padStart(21, '0')}`;

  return {
    recipientName: `LLC ${seed.pharmacyName}`,
    taxId: `3000000${accountNumber}`,
    iban: `UA${ibanTail}`,
    bankName: accountNumber === 5 ? 'JSC PrivatBank' : 'JSC Oschadbank',
    receiptEmail: seed.publicEmail ?? seed.email,
    paymentPurpose: `Payment for E-PHARMACY orders from ${seed.pharmacyName}`,
  };
}

//===============================================================

type OfferPricePoint = Readonly<{
  occurredAt: Date;
  unitPrice: number;
}>;

type OfferPriceTimeline = Map<string, OfferPricePoint[]>;

async function getOfferPriceTimeline(
  offerIds: Types.ObjectId[]
): Promise<OfferPriceTimeline> {
  const arrivalMovements = await StockMovement.find({
    productOfferId: { $in: offerIds },
    eventType: 'arrival',
  })
    .sort({ occurredAt: 1, _id: 1 })
    .select('productOfferId unitPrice occurredAt')
    .lean<
      Array<{
        productOfferId: Types.ObjectId;
        unitPrice: number;
        occurredAt: Date;
      }>
    >();

  const timelineByOfferId: OfferPriceTimeline = new Map();

  arrivalMovements.forEach((movement) => {
    const offerId = String(movement.productOfferId);
    const timeline = timelineByOfferId.get(offerId) ?? [];

    timeline.push({
      occurredAt: movement.occurredAt,
      unitPrice: movement.unitPrice,
    });
    timelineByOfferId.set(offerId, timeline);
  });

  return timelineByOfferId;
}

//===============================================================

function resolveOfferPriceAt(
  timelineByOfferId: OfferPriceTimeline,
  offerId: Types.ObjectId,
  occurredAt: Date
): number {
  const timeline = timelineByOfferId.get(String(offerId)) ?? [];
  const pricePoint = [...timeline]
    .reverse()
    .find((item) => item.occurredAt.getTime() <= occurredAt.getTime());

  if (!pricePoint) {
    throw new Error(
      `Product offer ${offerId.toString()} has no stock arrival before ${occurredAt.toISOString()}.`
    );
  }

  return pricePoint.unitPrice;
}

//===============================================================

async function seedOwnProductRestocks(): Promise<number> {
  const pharmacy = await Pharmacy.findOne({ email: 'care_pharmacy@ukr.net' })
    .select('_id')
    .lean();
  if (!pharmacy) return 0;

  const selloutProducts = await Product.find({
    _id: { $ne: STOCK_MOVEMENT_DEMO_PRODUCT_ID },
  })
    .sort({ article: 1, _id: 1 })
    .limit(4)
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();
  const selloutProductIds = new Set(
    selloutProducts.map((product) => String(product._id))
  );
  const offers = await ProductOffer.find({ pharmacyId: pharmacy._id }).sort({
    productId: 1,
  });

  for (const [index, offer] of offers.entries()) {
    const occurredAt = selloutProductIds.has(String(offer.productId))
      ? new Date('2026-05-15T12:00:00.000Z')
      : new Date('2026-07-15T12:00:00.000Z');
    const quantity = 40 + (index % 11);
    const priceIncrease = 50 + (index % 11);
    const nextPrice = offer.price + priceIncrease;
    offer.totalQuantity += quantity;
    offer.availableQuantity += quantity;
    offer.price = nextPrice;
    await offer.save();

    await StockMovement.create({
      productOfferId: offer._id,
      productId: offer.productId,
      pharmacyId: offer.pharmacyId,
      eventType: 'arrival',
      source: 'pharmacy_stock',
      stockDelta: quantity,
      reservedDelta: 0,
      availableDelta: quantity,
      stockAfter: offer.totalQuantity,
      reservedAfter: offer.reservedQuantity,
      availableAfter: offer.availableQuantity,
      unitPrice: nextPrice,
      comment: `Stock arrival added ${quantity} units at the updated price.`,
      occurredAt,
    });
  }

  return offers.length;
}

//===============================================================

async function seedPharmacyAccounts(): Promise<number> {
  const password = await hashPassword(PHARMACY_ACCOUNT_PASSWORD);
  let createdCount = 0;

  for (const seed of PHARMACY_ACCOUNT_SEEDS) {
    const user = await User.findOneAndUpdate(
      { email: seed.email },
      {
        $set: {
          name: seed.ownerName,
          email: seed.email,
          password,
          role: USER_ROLES.PHARMACY,
          status: USER_STATUSES.ACTIVE,
          phone: seed.phone,
          address: seed.address,
        },
      },
      {
        returnDocument: 'after',
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const pharmacy = await Pharmacy.findOneAndUpdate(
      { ownerId: user._id },
      {
        $set: {
          name: seed.pharmacyName,
          address: seed.address,
          city: seed.address.endsWith('Kyiv') ? 'Kyiv' : 'Lviv',
          phone: seed.phone,
          email: seed.publicEmail ?? seed.email,
          workingHours:
            seed.workingHours ??
            'Mon: 09:00-18:00; Tue: 09:00-18:00; Wed: 09:00-18:00; Thu: 09:00-18:00; Fri: 09:00-18:00; Sat: 10:00-17:00; Sun: Closed',
          bankDetails: createPharmacyAccountBankDetails(seed),
          rating: 0,
          imageUrl: seed.imageUrl ?? PHARMACY_ACCOUNT_FALLBACK_IMAGE_URL,
          description:
            seed.description ??
            createPharmacyAccountDescription(seed.pharmacyName),
          reviewsCount: 0,
          managerUserIds: [],
          documents: createVerificationDocuments(seed.email),
          status: seed.status,
          ...(seed.statusReason ? { statusReason: seed.statusReason } : {}),
          ...(seed.status === PHARMACY_STATUSES.ACTIVE
            ? {
                approvedBy: user._id,
                approvedAt: ACTIVE_PHARMACY_FIRST_ACTIVATED_AT,
                activatedAt: ACTIVE_PHARMACY_FIRST_ACTIVATED_AT,
              }
            : {}),
          updatedBy: user._id,
        },
        $unset: {
          pendingModeration: '',
          ...(seed.statusReason ? {} : { statusReason: '' }),
          ...(seed.status === PHARMACY_STATUSES.ACTIVE
            ? {}
            : { approvedBy: '', approvedAt: '', activatedAt: '' }),
        },
        $setOnInsert: {
          ownerId: user._id,
          createdBy: user._id,
        },
      },
      {
        returnDocument: 'after',
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    if (pharmacy) {
      createdCount += 1;

      if (seed.status === PHARMACY_STATUSES.ACTIVE) {
        await ensureDefaultPharmacyClient(pharmacy._id, user._id);
      }
    }
  }

  return createdCount;
}

//===============================================================

function createSeedPharmacies() {
  return Array.from({ length: 98 }, (_, index) => {
    const pharmacyNumber = index + 1;
    const city = CITIES[index % CITIES.length];
    const brand = PHARMACY_BRANDS[index % PHARMACY_BRANDS.length];
    const street = STREETS[index % STREETS.length];
    const reviewsCount = index < 34 ? 26 + (index % 9) : 6 + (index % 18);

    const pharmacyName = `${brand} ${city} ${pharmacyNumber}`;

    return {
      name: pharmacyName,
      address: `${12 + index} ${street}`,
      city,
      phone: `+380${String(501000000 + pharmacyNumber).padStart(9, '0')}`,
      email: `pharmacy.${pharmacyNumber}@e-pharmacy.example.com`,
      workingHours:
        'Mon: 09:00-18:00; Tue: 09:00-18:00; Wed: 09:00-18:00; Thu: 09:00-18:00; Fri: 09:00-18:00; Sat: 10:00-17:00; Sun: Closed',
      bankDetails: createBankDetails(pharmacyName, pharmacyNumber),
      rating: Number((4 + (index % 10) * 0.1).toFixed(1)),
      imageUrl: createPharmacyImageUrl(index),
      description: `${brand} in ${city} offers everyday medicines, vitamins, medical devices, hygiene products, and quick online reservation for local clients.`,
      ownerId: new mongoose.Types.ObjectId(),
      managerUserIds: [],
      status: PHARMACY_STATUSES.ACTIVE,
      reviewsCount,
      reviews: createModeratedReviews(reviewsCount, 4),
    };
  });
}

//===============================================================

function createSeedProducts(pharmacies: SeedPharmacyDocument[]) {
  return Array.from({ length: 126 }, (_, index) => {
    const productNumber = index + 1;

    const [
      baseName,
      category,
      manufacturer,
      dosage,
      packageQuantity,
      imageUrl,
    ] = PRODUCT_BLUEPRINTS[index % PRODUCT_BLUEPRINTS.length];

    const status = index >= 122 ? ('blocked' as const) : ('active' as const);
    const variantIndex = Math.floor(index / PRODUCT_BLUEPRINTS.length);

    const name = createProductName(
      baseName,
      manufacturer,
      dosage,
      packageQuantity,
      variantIndex
    );

    const isPremium = index % 6 === 0 || index % 11 === 0;

    const basePrice = isPremium
      ? 1050 + ((index * 137) % 2450)
      : 75 + ((index * 29) % 780);

    const offersCount = index % 10 === 0 ? 25 : 2 + (index % 5);

    const selectedPharmacies = Array.from(
      { length: offersCount },
      (_, offerIndex) =>
        pharmacies[(index * 3 + offerIndex) % pharmacies.length]
    );

    const isSoldOut = index % 17 === 0;
    const richStockPharmacies = index < 115 ? pharmacies.slice(0, 10) : [];

    const mergedPharmacies = [
      ...richStockPharmacies,
      ...selectedPharmacies.filter(
        (pharmacy) =>
          !richStockPharmacies.some(
            (richPharmacy) =>
              richPharmacy._id.toString() === pharmacy._id.toString()
          )
      ),
    ];
    const shouldForceRichStock = index < 115;

    const offers =
      isSoldOut && !shouldForceRichStock
        ? []
        : mergedPharmacies.map((pharmacy, offerIndex) =>
            createOffer(
              pharmacy,
              basePrice + offerIndex * (7 + (index % 5)),
              shouldForceRichStock && offerIndex < 10
                ? 40 + ((index + offerIndex) % 35)
                : 12 + ((index + offerIndex) % 48)
            )
          );

    const reviewsCount =
      index < 38
        ? 18 + (index % 16)
        : index % 4 === 0
          ? 10 + (index % 8)
          : index % 9;
    const rating = Number((4 + (index % 11) * 0.09).toFixed(1));

    return {
      ...(baseName === 'Carvedilol' && variantIndex === 0
        ? { _id: STOCK_MOVEMENT_DEMO_PRODUCT_ID }
        : {}),
      name,
      slug: createSlug(name),
      article: `EPH-${String(productNumber).padStart(4, '0')}`,
      description: `${name} is a realistic demo catalog item for testing product cards, price formatting, long review text, filters, sorting, pharmacy availability, and responsive catalog layouts.`,
      category,
      status,
      price: offers.length > 0 ? basePrice : 0,
      imageUrl,
      manufacturer,
      dosage,
      packageQuantity,
      pharmacyId: offers[0]?.pharmacyId,
      pharmacyName: offers[0]?.pharmacyName,
      offers,
      inStock: offers.some((offer) => offer.availableQuantity > 0),
      rating,
      reviewsCount,
      reviews: createModeratedReviews(reviewsCount, 4),
    };
  });
}

//===============================================================

async function seedActivePharmacyProductOffers(
  products: Array<{ _id: Types.ObjectId; status: string; price: number }>
): Promise<number> {
  const activePharmacy = await Pharmacy.findOne({
    email: 'care_pharmacy@ukr.net',
  })
    .select('_id')
    .lean<{ _id: Types.ObjectId } | null>();

  if (!activePharmacy) return 0;

  const activeProducts = products
    .filter((product) => product.status === 'active')
    .slice(0, 30);

  if (!activeProducts.length) return 0;

  const stockArrivalAt = new Date('2026-06-18T09:00:00.000Z');

  await Promise.all([
    ProductOffer.deleteMany({ pharmacyId: activePharmacy._id }),
    StockMovement.deleteMany({ pharmacyId: activePharmacy._id }),
  ]);

  const createdOffers = await ProductOffer.insertMany(
    activeProducts.map((product, index) => {
      const initialSelloutQuantities = [36, 42, 48, 54];
      const quantity =
        index < 4 ? initialSelloutQuantities[index] : 100 + index * 3;

      const offerCreatedAt =
        index < 4 ? new Date('2026-05-01T09:00:00.000Z') : stockArrivalAt;

      return {
        productId: product._id,
        pharmacyId: activePharmacy._id,
        price: product.price > 0 ? product.price : 100 + index * 10,
        totalQuantity: quantity,
        availableQuantity: quantity,
        reservedQuantity: 0,
        createdAt: offerCreatedAt,
        updatedAt: offerCreatedAt,
      };
    })
  );

  await StockMovement.insertMany(
    createdOffers.map((offer) => ({
      productOfferId: offer._id,
      productId: offer.productId,
      pharmacyId: offer.pharmacyId,
      eventType: 'arrival',
      source: 'pharmacy_stock',
      stockDelta: offer.totalQuantity,
      reservedDelta: 0,
      availableDelta: offer.availableQuantity,
      stockAfter: offer.totalQuantity,
      reservedAfter: offer.reservedQuantity,
      availableAfter: offer.availableQuantity,
      unitPrice: offer.price,
      comment: 'Initial stock quantity added to the pharmacy warehouse.',
      occurredAt: offer.createdAt,
    }))
  );

  return activeProducts.length;
}

//===============================================================

async function seedActivePharmacyOrder(): Promise<number> {
  type SeedPharmacyLean = {
    _id: Types.ObjectId;
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    workingHours?: string;
    imageUrl?: string;
    rating?: number;
    reviewsCount?: number;
    bankDetails?: unknown;
  };

  type SeedProductLean = {
    _id: Types.ObjectId;
    name: string;
    slug?: string;
    article: string;
    category: string;
    imageUrl?: string;
    manufacturer?: string;
    dosage?: string;
    packageQuantity?: string | number;
    rating?: number;
    reviewsCount?: number;
  };

  type DemoOrderStatus = 'new' | 'in_progress' | 'successful' | 'rejected';

  type DemoOrderConfig = {
    status: DemoOrderStatus;
    quantity: number;
    createdAt: Date;
    statusChangedAt: Date;
  };

  const pharmacy = await Pharmacy.findOne({ email: 'care_pharmacy@ukr.net' })
    .select(
      '_id name address city phone email workingHours imageUrl rating reviewsCount bankDetails'
    )
    .lean<SeedPharmacyLean | null>();

  if (!pharmacy) return 0;

  const product = await Product.findById(
    STOCK_MOVEMENT_DEMO_PRODUCT_ID
  ).lean<SeedProductLean | null>();

  if (!product) return 0;

  const offer = await ProductOffer.findOne({
    pharmacyId: pharmacy._id,
    productId: product._id,
  });

  if (!offer) return 0;

  const password = await hashPassword('123456789');

  await User.updateOne(
    { email: STOCK_MOVEMENT_DEMO_CLIENT_EMAIL },
    { $set: { pictureUrl: '/images/seed/clients/client-008.png' } }
  );
  const clientUser = await User.findOneAndUpdate(
    { email: STOCK_MOVEMENT_DEMO_CLIENT_EMAIL },
    {
      $set: {
        name: 'Nata',
        email: STOCK_MOVEMENT_DEMO_CLIENT_EMAIL,
        password,
        role: USER_ROLES.CLIENT,
        status: USER_STATUSES.ACTIVE,
        phone: '+380968016907',
        address: '27 Wellness Street, Lviv, Lviv',
        pictureUrl: '/images/seed/clients/client-008.png',
      },
    },
    {
      returnDocument: 'after',
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  const additionalFavoritePharmacies = await Pharmacy.find({
    _id: { $ne: pharmacy._id },
    status: PHARMACY_STATUSES.ACTIVE,
  })
    .sort({ name: 1, _id: 1 })
    .limit(20)
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();

  await Client.findOneAndUpdate(
    { userId: clientUser._id },
    {
      $set: {
        userId: clientUser._id,
        favoriteProductIds: [],
        favoritePharmacyIds: [
          pharmacy._id,
          ...additionalFavoritePharmacies.map((item) => item._id),
        ],
      },
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  await Promise.all([
    Order.deleteMany({ pharmacyId: pharmacy._id }),
    Cart.deleteMany({ clientUserId: clientUser._id }),
    StockMovement.deleteMany({ productOfferId: offer._id }),
  ]);

  const orderConfigs: DemoOrderConfig[] = [
    {
      status: 'new',
      quantity: 10,
      createdAt: new Date('2026-07-16T08:00:00.000Z'),
      statusChangedAt: new Date('2026-07-16T08:00:00.000Z'),
    },
    {
      status: 'in_progress',
      quantity: 10,
      createdAt: new Date('2026-07-16T08:20:00.000Z'),
      statusChangedAt: new Date('2026-07-16T08:40:00.000Z'),
    },
    {
      status: 'rejected',
      quantity: 10,
      createdAt: new Date('2026-07-12T08:00:00.000Z'),
      statusChangedAt: new Date('2026-07-12T10:00:00.000Z'),
    },
    {
      status: 'successful',
      quantity: 7,
      createdAt: new Date('2026-07-13T08:00:00.000Z'),
      statusChangedAt: new Date('2026-07-13T10:00:00.000Z'),
    },
  ];

  function createStatusHistory(config: DemoOrderConfig) {
    const history: Array<{
      status: DemoOrderStatus;
      changedAt: Date;
      changedBy: Types.ObjectId;
      comment?: string;
    }> = [
      {
        status: 'new',
        changedAt: config.createdAt,
        changedBy: clientUser._id,
      },
    ];

    if (config.status !== 'new') {
      history.push({
        status: 'in_progress',
        changedAt:
          config.status === 'in_progress'
            ? config.statusChangedAt
            : new Date(config.createdAt.getTime() + 60 * 60 * 1000),
        changedBy: clientUser._id,
      });
    }

    if (config.status === 'successful') {
      history.push({
        status: 'successful',
        changedAt: config.statusChangedAt,
        changedBy: clientUser._id,
        comment: 'The pharmacy confirmed and completed the order.',
      });
    }

    if (config.status === 'rejected') {
      history.push({
        status: 'rejected',
        changedAt: config.statusChangedAt,
        changedBy: clientUser._id,
        comment: 'The pharmacy cancelled the order and released its reserve.',
      });
    }

    return history;
  }

  const productSnapshot = {
    name: product.name,
    ...(product.slug ? { slug: product.slug } : {}),
    article: product.article,
    category: product.category,
    ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
    ...(product.manufacturer ? { manufacturer: product.manufacturer } : {}),
    ...(product.dosage ? { dosage: product.dosage } : {}),
    ...(product.packageQuantity
      ? { packageQuantity: String(product.packageQuantity) }
      : {}),
    rating: product.rating ?? 0,
    reviewsCount: product.reviewsCount ?? 0,
  };

  const pharmacySnapshot = {
    name: pharmacy.name,
    address: pharmacy.address,
    city: pharmacy.city,
    phone: pharmacy.phone,
    email: pharmacy.email,
    ...(pharmacy.workingHours ? { workingHours: pharmacy.workingHours } : {}),
    ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
    rating: pharmacy.rating ?? 0,
    reviewsCount: pharmacy.reviewsCount ?? 0,
    bankDetails: pharmacy.bankDetails,
  };

  const seededOrders = orderConfigs.map((config) => {
    const orderId = new Types.ObjectId();
    const orderNumber = createSeedOrderNumber(orderId, config.createdAt);
    const totalPrice = config.quantity * STOCK_MOVEMENT_DEMO_ORDER_PRICE;

    return {
      _id: orderId,
      orderNumber,
      status: config.status,
      quantity: config.quantity,
      createdAt: config.createdAt,
      statusChangedAt: config.statusChangedAt,
      document: {
        _id: orderId,
        userId: clientUser._id,
        pharmacyId: pharmacy._id,
        pharmacySnapshot,
        items: [
          {
            productId: product._id,
            productOfferId: offer._id,
            productSnapshot,
            quantity: config.quantity,
            unitPrice: STOCK_MOVEMENT_DEMO_ORDER_PRICE,
            totalPrice,
          },
        ],
        totalItems: config.quantity,
        totalPrice,
        currency: 'UAH',
        paymentMethod:
          config.status === 'new' || config.status === 'rejected'
            ? 'cash'
            : 'bank_transfer',
        delivery:
          config.status === 'new' || config.status === 'successful'
            ? { method: 'pickup' }
            : {
                method: 'postal_delivery',
                details: {
                  recipientName: 'Nata',
                  recipientPhone: '+380968016907',
                  address: '27 Wellness Street, Lviv, Lviv',
                },
              },
        comment: `Demo order for ${product.name}.`,
        status: config.status,
        statusHistory: createStatusHistory(config),
        activityHistory: [
          {
            type: 'product_added',
            occurredAt: config.createdAt,
            changedBy: clientUser._id,
            productId: product._id,
            productOfferId: offer._id,
            productName: product.name,
            previousQuantity: 0,
            quantity: config.quantity,
            quantityDelta: config.quantity,
            previousUnitPrice: STOCK_MOVEMENT_DEMO_ORDER_PRICE,
            unitPrice: STOCK_MOVEMENT_DEMO_ORDER_PRICE,
          },
        ],
        ...(config.status === 'rejected'
          ? {
              rejectionReason:
                'The order was cancelled for the stock movement demonstration.',
              rejectedAt: config.statusChangedAt,
              rejectedBy: clientUser._id,
            }
          : {}),
        orderNumber,
        createdAt: config.createdAt,
        updatedAt: config.statusChangedAt,
      },
    };
  });

  await Order.insertMany(seededOrders.map((order) => order.document));

  const [newOrder, inProgressOrder, rejectedOrder, successfulOrder] =
    seededOrders;

  await StockMovement.insertMany([
    {
      productOfferId: offer._id,
      productId: product._id,
      pharmacyId: pharmacy._id,
      eventType: 'arrival',
      source: 'pharmacy_stock',
      quantity: 127,
      stockDelta: 127,
      reservedDelta: 0,
      availableDelta: 127,
      stockAfter: 127,
      reservedAfter: 0,
      availableAfter: 127,
      unitPrice: STOCK_MOVEMENT_DEMO_ORDER_PRICE,
      comment: 'Stock arrival added 127 units at 1 968,00 UAH per unit.',
      occurredAt: new Date('2026-07-09T09:00:00.000Z'),
    },
    {
      productOfferId: offer._id,
      productId: product._id,
      pharmacyId: pharmacy._id,
      eventType: 'reserve',
      source: 'client_order',
      quantity: 10,
      stockDelta: 0,
      reservedDelta: 10,
      availableDelta: -10,
      stockAfter: 170,
      reservedAfter: 10,
      availableAfter: 160,
      unitPrice: STOCK_MOVEMENT_DEMO_ORDER_PRICE,
      orderId: newOrder._id,
      orderNumber: newOrder.orderNumber,
      orderStatus: 'new',
      comment: 'New order reserved 10 units from the available stock.',
      occurredAt: newOrder.createdAt,
    },
    {
      productOfferId: offer._id,
      productId: product._id,
      pharmacyId: pharmacy._id,
      eventType: 'reserve',
      source: 'client_order',
      quantity: 10,
      stockDelta: 0,
      reservedDelta: 10,
      availableDelta: -10,
      stockAfter: 170,
      reservedAfter: 20,
      availableAfter: 150,
      unitPrice: STOCK_MOVEMENT_DEMO_ORDER_PRICE,
      orderId: inProgressOrder._id,
      orderNumber: inProgressOrder.orderNumber,
      orderStatus: 'in_progress',
      comment:
        'In progress order reserved 10 more units from the available stock.',
      occurredAt: inProgressOrder.statusChangedAt,
    },
    {
      productOfferId: offer._id,
      productId: product._id,
      pharmacyId: pharmacy._id,
      eventType: 'reserve',
      source: 'client_order',
      quantity: 10,
      stockDelta: 0,
      reservedDelta: 10,
      availableDelta: -10,
      stockAfter: 127,
      reservedAfter: 10,
      availableAfter: 117,
      unitPrice: STOCK_MOVEMENT_DEMO_ORDER_PRICE,
      orderId: rejectedOrder._id,
      orderNumber: rejectedOrder.orderNumber,
      orderStatus: 'new',
      comment: 'Rejected demo order initially reserved 10 units.',
      occurredAt: rejectedOrder.createdAt,
    },
    {
      productOfferId: offer._id,
      productId: product._id,
      pharmacyId: pharmacy._id,
      eventType: 'release',
      source: 'client_order',
      quantity: 10,
      stockDelta: 0,
      reservedDelta: -10,
      availableDelta: 10,
      stockAfter: 127,
      reservedAfter: 0,
      availableAfter: 127,
      unitPrice: STOCK_MOVEMENT_DEMO_ORDER_PRICE,
      orderId: rejectedOrder._id,
      orderNumber: rejectedOrder.orderNumber,
      orderStatus: 'rejected',
      comment:
        'Rejected order released its 10 reserved units back to available stock.',
      occurredAt: rejectedOrder.statusChangedAt,
    },
    {
      productOfferId: offer._id,
      productId: product._id,
      pharmacyId: pharmacy._id,
      eventType: 'reserve',
      source: 'client_order',
      quantity: 7,
      stockDelta: 0,
      reservedDelta: 7,
      availableDelta: -7,
      stockAfter: 127,
      reservedAfter: 7,
      availableAfter: 120,
      unitPrice: STOCK_MOVEMENT_DEMO_ORDER_PRICE,
      orderId: successfulOrder._id,
      orderNumber: successfulOrder.orderNumber,
      orderStatus: 'new',
      comment: 'Successful demo order initially reserved 7 units.',
      occurredAt: successfulOrder.createdAt,
    },
    {
      productOfferId: offer._id,
      productId: product._id,
      pharmacyId: pharmacy._id,
      eventType: 'write_off',
      source: 'client_order',
      quantity: 7,
      stockDelta: -7,
      reservedDelta: -7,
      availableDelta: 0,
      stockAfter: 120,
      reservedAfter: 0,
      availableAfter: 120,
      unitPrice: STOCK_MOVEMENT_DEMO_ORDER_PRICE,
      orderId: successfulOrder._id,
      orderNumber: successfulOrder.orderNumber,
      orderStatus: 'successful',
      comment:
        'Successful order wrote off its 7 reserved units from the warehouse.',
      occurredAt: successfulOrder.statusChangedAt,
    },
    {
      productOfferId: offer._id,
      productId: product._id,
      pharmacyId: pharmacy._id,
      eventType: 'arrival',
      source: 'pharmacy_stock',
      quantity: 50,
      stockDelta: 50,
      reservedDelta: 0,
      availableDelta: 50,
      stockAfter: 170,
      reservedAfter: 0,
      availableAfter: 170,
      unitPrice: STOCK_MOVEMENT_DEMO_CURRENT_PRICE,
      comment:
        'Stock arrival added 50 units at the new price of 2 010,00 UAH per unit.',
      occurredAt: new Date('2026-07-14T09:00:00.000Z'),
    },
  ]);

  offer.set({
    price: STOCK_MOVEMENT_DEMO_CURRENT_PRICE,
    totalQuantity: 170,
    reservedQuantity: 20,
    availableQuantity: 150,
    updatedAt: new Date('2026-07-16T08:40:00.000Z'),
  });
  await offer.save();

  return seededOrders.length;
}

//===============================================================

async function seedPharmacyClientPortfolio(): Promise<number> {
  type DemoClientStatus = 'new' | 'in_progress' | 'successful' | 'rejected';
  type DemoClientConfig = Readonly<{
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    pictureUrl: string;
    status: 'active' | 'blocked';
    statusReason?: string;
    orderStatuses: DemoClientStatus[];
  }>;

  type DemoOffer = Readonly<{
    _id: Types.ObjectId;
    productId: Types.ObjectId;
    price: number;
    totalQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
  }>;

  type DemoProduct = Readonly<{
    _id: Types.ObjectId;
    name: string;
    slug?: string;
    article: string;
    category: string;
    imageUrl?: string;
    manufacturer?: string;
    dosage?: string;
    packageQuantity?: string | number;
    rating?: number;
    reviewsCount?: number;
  }>;

  type OfferWithProduct = Readonly<{
    offer: DemoOffer;
    product: DemoProduct;
  }>;

  type OfferBalance = {
    total: number;
    reserved: number;
    available: number;
  };

  type MovementPlan = Readonly<{
    eventType: 'reserve' | 'release' | 'write_off';
    offerId: Types.ObjectId;
    productId: Types.ObjectId;
    quantity: number;
    unitPrice: number;
    orderId: Types.ObjectId;
    orderNumber: string;
    orderStatus: DemoClientStatus;
    comment: string;
    occurredAt: Date;
  }>;

  const pharmacy = await Pharmacy.findOne({ email: 'care_pharmacy@ukr.net' })
    .select(
      '_id name address city phone email workingHours imageUrl rating reviewsCount bankDetails'
    )
    .lean<{
      _id: Types.ObjectId;
      name: string;
      address: string;
      city: string;
      phone: string;
      email: string;
      workingHours?: string;
      imageUrl?: string;
      rating?: number;
      reviewsCount?: number;
      bankDetails?: unknown;
    } | null>();

  if (!pharmacy) return 0;

  const selloutProducts = await Product.find({
    _id: { $ne: STOCK_MOVEMENT_DEMO_PRODUCT_ID },
  })
    .sort({ article: 1, _id: 1 })
    .limit(4)
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();

  const offers = await ProductOffer.find({
    pharmacyId: pharmacy._id,
    productId: {
      $nin: [
        STOCK_MOVEMENT_DEMO_PRODUCT_ID,
        ...selloutProducts.map((product) => product._id),
      ],
    },
    availableQuantity: { $gte: 20 },
  })
    .sort({ productId: 1 })
    .limit(30)
    .lean<DemoOffer[]>();

  const products = await Product.find({
    _id: { $in: offers.map((offer) => offer.productId) },
  })
    .select(
      '_id name slug article category imageUrl manufacturer dosage packageQuantity rating reviewsCount'
    )
    .lean<DemoProduct[]>();

  const productsById = new Map(
    products.map((product) => [String(product._id), product])
  );

  const joinedOffers = offers
    .map((offer) => {
      const product = productsById.get(String(offer.productId));
      return product ? ({ offer, product } satisfies OfferWithProduct) : null;
    })
    .filter((item): item is OfferWithProduct => Boolean(item));

  if (joinedOffers.length < 4) return 0;

  const priceTimelineByOfferId = await getOfferPriceTimeline(
    joinedOffers.map(({ offer }) => offer._id)
  );

  const clientConfigs: DemoClientConfig[] = [
    {
      id: '6a311d5386d9f5e0be7d19aa',
      name: 'Olena Kovalenko',
      email: 'olena.kovalenko.demo@ukr.net',
      phone: '+380671110101',
      address: '11 Horodotska Street, Lviv',
      pictureUrl: '/images/seed/clients/client-001.png',
      status: 'active',
      orderStatuses: ['successful', 'in_progress', 'new', 'rejected'],
    },
    {
      id: '6a311d5386d9f5e0be7d19ab',
      name: 'Iryna Bondar',
      email: 'iryna.bondar.demo@ukr.net',
      phone: '+380671110102',
      address: '24 Shevchenka Street, Lviv',
      pictureUrl: '/images/seed/clients/client-002.png',
      status: 'active',
      orderStatuses: ['successful', 'successful', 'new'],
    },
    {
      id: '6a311d5386d9f5e0be7d19ac',
      name: 'Maksym Hnatiuk',
      email: 'maksym.hnatiuk.demo@ukr.net',
      phone: '+380671110103',
      address: '8 Zelena Street, Lviv',
      pictureUrl: '/images/seed/clients/client-003.png',
      status: 'active',
      orderStatuses: ['in_progress', 'rejected', 'successful'],
    },
    {
      id: '6a311d5386d9f5e0be7d19ad',
      name: 'Sofiia Melnyk',
      email: 'sofiia.melnyk.demo@ukr.net',
      phone: '+380671110104',
      address: '42 Franka Street, Lviv',
      pictureUrl: '/images/seed/clients/client-004.png',
      status: 'active',
      orderStatuses: ['new', 'successful', 'rejected', 'in_progress'],
    },
    {
      id: '6a311d5386d9f5e0be7d19ae',
      name: 'Andrii Koval',
      email: 'andrii.koval.demo@ukr.net',
      phone: '+380671110105',
      address: '15 Stryiska Street, Lviv',
      pictureUrl: '/images/seed/clients/client-005.png',
      status: 'active',
      orderStatuses: ['successful', 'new', 'in_progress'],
    },
    {
      id: '6a311d5386d9f5e0be7d19af',
      name: 'Kateryna Savchuk',
      email: 'kateryna.savchuk.demo@ukr.net',
      phone: '+380671110106',
      address: '6 Pekarska Street, Lviv',
      pictureUrl: '/images/seed/clients/client-006.png',
      status: 'active',
      orderStatuses: ['rejected', 'successful', 'new', 'successful'],
    },
    {
      id: '6a311d5386d9f5e0be7d19b0',
      name: 'Roman Danyliuk',
      email: 'roman.danyliuk.demo@ukr.net',
      phone: '+380671110107',
      address: '19 Lychakivska Street, Lviv',
      pictureUrl: '/images/seed/clients/client-007.png',
      status: 'blocked',
      statusReason:
        'The client account is inactive after repeated uncollected orders. New reservations require manager approval.',
      orderStatuses: ['rejected', 'successful', 'new'],
    },
    {
      id: '6a311d5386d9f5e0be7d19b1',
      name: 'Anastasiia Shevchenko',
      email: 'anastasiia.shevchenko.portfolio@ukr.net',
      phone: '+380672221100',
      address: '10 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-009.png',
      status: 'active',

      orderStatuses: ['successful', 'in_progress', 'new', 'rejected'],
    },
    {
      id: '6a311d5386d9f5e0be7d19b2',
      name: 'Mariia Tkachenko',
      email: 'mariia.tkachenko.portfolio@ukr.net',
      phone: '+380672221101',
      address: '11 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-010.png',
      status: 'active',

      orderStatuses: [
        'successful',
        'in_progress',
        'new',
        'rejected',
        'successful',
      ],
    },
    {
      id: '6a311d5386d9f5e0be7d19b3',
      name: 'Viktoriia Moroz',
      email: 'viktoriia.moroz.portfolio@ukr.net',
      phone: '+380672221102',
      address: '12 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-011.png',
      status: 'active',

      orderStatuses: ['successful', 'in_progress', 'new', 'rejected'],
    },
    {
      id: '6a311d5386d9f5e0be7d19b4',
      name: 'Alina Kravets',
      email: 'alina.kravets.portfolio@ukr.net',
      phone: '+380672221103',
      address: '13 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-012.png',
      status: 'active',

      orderStatuses: [
        'successful',
        'in_progress',
        'new',
        'rejected',
        'successful',
      ],
    },
    {
      id: '6a311d5386d9f5e0be7d19b5',
      name: 'Daria Poliakova',
      email: 'daria.poliakova.portfolio@ukr.net',
      phone: '+380672221104',
      address: '14 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-013.png',
      status: 'active',

      orderStatuses: ['successful', 'in_progress', 'new', 'rejected'],
    },
    {
      id: '6a311d5386d9f5e0be7d19b6',
      name: 'Yuliia Marchenko',
      email: 'yuliia.marchenko.portfolio@ukr.net',
      phone: '+380672221105',
      address: '15 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-014.png',
      status: 'blocked',
      statusReason:
        'The client is temporarily blocked after repeated uncollected orders.',
      orderStatuses: [
        'successful',
        'in_progress',
        'new',
        'rejected',
        'successful',
      ],
    },
    {
      id: '6a311d5386d9f5e0be7d19b7',
      name: 'Veronika Lisova',
      email: 'veronika.lisova.portfolio@ukr.net',
      phone: '+380672221106',
      address: '16 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-015.png',
      status: 'active',

      orderStatuses: ['successful', 'in_progress', 'new', 'rejected'],
    },
    {
      id: '6a311d5386d9f5e0be7d19b8',
      name: 'Tetiana Klymenko',
      email: 'tetiana.klymenko.portfolio@ukr.net',
      phone: '+380672221107',
      address: '17 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-016.png',
      status: 'active',

      orderStatuses: [
        'successful',
        'in_progress',
        'new',
        'rejected',
        'successful',
      ],
    },
    {
      id: '6a311d5386d9f5e0be7d19b9',
      name: 'Diana Pavlenko',
      email: 'diana.pavlenko.portfolio@ukr.net',
      phone: '+380672221108',
      address: '18 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-017.png',
      status: 'active',

      orderStatuses: ['successful', 'in_progress', 'new', 'rejected'],
    },
    {
      id: '6a311d5386d9f5e0be7d19ba',
      name: 'Anna Rudenko',
      email: 'anna.rudenko.portfolio@ukr.net',
      phone: '+380672221109',
      address: '19 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-018.png',
      status: 'active',

      orderStatuses: [
        'successful',
        'in_progress',
        'new',
        'rejected',
        'successful',
      ],
    },
    {
      id: '6a311d5386d9f5e0be7d19bb',
      name: 'Oleksandr Mazur',
      email: 'oleksandr.mazur.portfolio@ukr.net',
      phone: '+380672221110',
      address: '20 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-019.png',
      status: 'active',

      orderStatuses: ['successful', 'in_progress', 'new', 'rejected'],
    },
    {
      id: '6a311d5386d9f5e0be7d19bc',
      name: 'Dmytro Horbunov',
      email: 'dmytro.horbunov.portfolio@ukr.net',
      phone: '+380672221111',
      address: '21 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-020.png',
      status: 'active',

      orderStatuses: [
        'successful',
        'in_progress',
        'new',
        'rejected',
        'successful',
      ],
    },
    {
      id: '6a311d5386d9f5e0be7d19bd',
      name: 'Bohdan Yaremchuk',
      email: 'bohdan.yaremchuk.portfolio@ukr.net',
      phone: '+380672221112',
      address: '22 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-021.png',
      status: 'active',

      orderStatuses: ['successful', 'in_progress', 'new', 'rejected'],
    },
    {
      id: '6a311d5386d9f5e0be7d19be',
      name: 'Artem Sydorenko',
      email: 'artem.sydorenko.portfolio@ukr.net',
      phone: '+380672221113',
      address: '23 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-022.png',
      status: 'active',

      orderStatuses: [
        'successful',
        'in_progress',
        'new',
        'rejected',
        'successful',
      ],
    },
    {
      id: '6a311d5386d9f5e0be7d19bf',
      name: 'Vladyslav Taran',
      email: 'vladyslav.taran.portfolio@ukr.net',
      phone: '+380672221114',
      address: '24 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-023.png',
      status: 'blocked',
      statusReason:
        'The client is temporarily blocked after repeated uncollected orders.',
      orderStatuses: ['successful', 'in_progress', 'new', 'rejected'],
    },
    {
      id: '6a311d5386d9f5e0be7d19c0',
      name: 'Mykhailo Petrenko',
      email: 'mykhailo.petrenko.portfolio@ukr.net',
      phone: '+380672221115',
      address: '25 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-024.png',
      status: 'active',

      orderStatuses: [
        'successful',
        'in_progress',
        'new',
        'rejected',
        'successful',
      ],
    },
    {
      id: '6a311d5386d9f5e0be7d19c1',
      name: 'Nazar Oliinyk',
      email: 'nazar.oliinyk.portfolio@ukr.net',
      phone: '+380672221116',
      address: '26 Portfolio Street, Lviv',
      pictureUrl: '/images/seed/clients/client-025.png',
      status: 'active',

      orderStatuses: ['successful', 'in_progress', 'new', 'rejected'],
    },
  ];

  const clientIds = clientConfigs.map(
    (client) => new Types.ObjectId(client.id)
  );

  const password = await hashPassword('123456789');

  await User.updateOne(
    { email: STOCK_MOVEMENT_DEMO_CLIENT_EMAIL },
    { $set: { pictureUrl: '/images/seed/clients/client-008.png' } }
  );

  await User.deleteMany({
    _id: { $nin: clientIds },
    $or: [
      { email: { $in: clientConfigs.map((client) => client.email) } },
      { phone: { $in: clientConfigs.map((client) => client.phone) } },
    ],
  });

  const clientUsers = await Promise.all(
    clientConfigs.map((client) =>
      User.findOneAndUpdate(
        { _id: new Types.ObjectId(client.id) },
        {
          $set: {
            name: client.name,
            email: client.email,
            password,
            role: USER_ROLES.CLIENT,
            status:
              client.status === 'blocked'
                ? USER_STATUSES.BLOCKED
                : USER_STATUSES.ACTIVE,
            phone: client.phone,
            address: client.address,
            pictureUrl: client.pictureUrl,
            ...(client.statusReason
              ? { statusReason: client.statusReason }
              : {}),
          },
          ...(client.statusReason ? {} : { $unset: { statusReason: '' } }),
        },
        {
          upsert: true,
          returnDocument: 'after',
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      )
    )
  );

  const resolvedClientUsers = clientUsers.map((clientUser) => {
    if (!clientUser) {
      throw new Error('Could not create the demo pharmacy client.');
    }

    return clientUser;
  });

  await Promise.all(
    resolvedClientUsers.map((clientUser) =>
      Client.findOneAndUpdate(
        { userId: clientUser._id },
        {
          $set: {
            userId: clientUser._id,
            favoriteProductIds: [],
            favoritePharmacyIds: [pharmacy._id],
          },
        },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true }
      )
    )
  );

  const pharmacySnapshot = {
    name: pharmacy.name,
    address: pharmacy.address,
    city: pharmacy.city,
    phone: pharmacy.phone,
    email: pharmacy.email,
    ...(pharmacy.workingHours ? { workingHours: pharmacy.workingHours } : {}),
    ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
    rating: pharmacy.rating ?? 0,
    reviewsCount: pharmacy.reviewsCount ?? 0,
    bankDetails: pharmacy.bankDetails,
  };

  const orderDocuments: Array<Record<string, unknown>> = [];
  const movementPlans: MovementPlan[] = [];
  const portfolioOrderSlots = clientConfigs
    .flatMap((client, clientIndex) =>
      client.orderStatuses.map((_status, orderIndex) => ({
        clientIndex,
        orderIndex,
      }))
    )
    .sort(
      (first, second) =>
        first.orderIndex - second.orderIndex ||
        first.clientIndex - second.clientIndex
    );
  const portfolioOrderCount = portfolioOrderSlots.length;
  const portfolioStatusTargets = {
    new: 10,
    inProgress: 8,
    rejected: 6,
  } as const;
  const portfolioStatusBySlot = new Map<string, DemoClientStatus>();

  portfolioOrderSlots.forEach((slot, index) => {
    const status: DemoClientStatus =
      index < portfolioStatusTargets.new
        ? 'new'
        : index < portfolioStatusTargets.new + portfolioStatusTargets.inProgress
          ? 'in_progress'
          : index <
              portfolioStatusTargets.new +
                portfolioStatusTargets.inProgress +
                portfolioStatusTargets.rejected
            ? 'rejected'
            : 'successful';

    portfolioStatusBySlot.set(`${slot.clientIndex}:${slot.orderIndex}`, status);
  });

  let portfolioOrderIndex = 0;
  let activeOrderIndex = 0;
  let rejectedOrderIndex = 0;
  let successfulOrderIndex = 0;

  clientConfigs.forEach((client, clientIndex) => {
    const clientUser = resolvedClientUsers[clientIndex];

    client.orderStatuses.forEach((_configuredStatus, orderIndex) => {
      const orderId = new Types.ObjectId();
      portfolioOrderIndex += 1;

      const status =
        portfolioStatusBySlot.get(`${clientIndex}:${orderIndex}`) ??
        'successful';

      let createdAt: Date;

      if (status === 'new' || status === 'in_progress') {
        createdAt = new Date(
          new Date('2026-07-16T07:00:00.000Z').getTime() +
            activeOrderIndex * 20 * 60 * 1000
        );
        activeOrderIndex += 1;
      } else if (status === 'rejected') {
        createdAt = new Date(
          new Date('2026-07-09T08:00:00.000Z').getTime() +
            rejectedOrderIndex * 24 * 60 * 60 * 1000 +
            rejectedOrderIndex * 35 * 60 * 1000
        );
        rejectedOrderIndex += 1;
      } else {
        const dayOffset = successfulOrderIndex % 26;
        const timeOffset = (successfulOrderIndex % 8) * 43 * 60 * 1000;
        createdAt = new Date(
          new Date('2026-06-20T08:00:00.000Z').getTime() +
            dayOffset * 24 * 60 * 60 * 1000 +
            timeOffset
        );
        successfulOrderIndex += 1;
      }

      const finalChangedAt = new Date(
        createdAt.getTime() + (status === 'new' ? 0 : 90 * 60 * 1000)
      );
      const orderNumber = createSeedOrderNumber(orderId, createdAt);
      const itemCount = 5 + ((clientIndex + orderIndex) % 2);
      const selectedItems = Array.from(
        { length: itemCount },
        (_, itemIndex) => {
          const poolIndex =
            (clientIndex * 4 + orderIndex * 3 + itemIndex) %
            joinedOffers.length;
          const selected = joinedOffers[poolIndex];
          const quantity = 1 + ((clientIndex + orderIndex + itemIndex) % 3);
          const product = selected.product;
          const offer = selected.offer;
          const unitPrice = resolveOfferPriceAt(
            priceTimelineByOfferId,
            offer._id,
            createdAt
          );
          const productSnapshot = {
            name: product.name,
            ...(product.slug ? { slug: product.slug } : {}),
            article: product.article,
            category: product.category,
            ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
            ...(product.manufacturer
              ? { manufacturer: product.manufacturer }
              : {}),
            ...(product.dosage ? { dosage: product.dosage } : {}),
            ...(product.packageQuantity
              ? { packageQuantity: String(product.packageQuantity) }
              : {}),
            rating: product.rating ?? 0,
            reviewsCount: product.reviewsCount ?? 0,
          };

          return {
            productId: product._id,
            productOfferId: offer._id,
            productSnapshot,
            quantity,
            unitPrice,
            totalPrice: quantity * unitPrice,
          };
        }
      );

      const totalItems = selectedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      const totalPrice = selectedItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      const statusHistory: Array<Record<string, unknown>> = [
        {
          status: 'new',
          changedAt: createdAt,
          changedBy: clientUser._id,
        },
      ];

      if (status !== 'new') {
        statusHistory.push({
          status: 'in_progress',
          changedAt:
            status === 'in_progress'
              ? finalChangedAt
              : new Date(createdAt.getTime() + 45 * 60 * 1000),
          changedBy: clientUser._id,
        });
      }

      if (status === 'successful' || status === 'rejected') {
        statusHistory.push({
          status,
          changedAt: finalChangedAt,
          changedBy: clientUser._id,
          comment:
            status === 'successful'
              ? 'The pharmacy completed the demo client order.'
              : 'The pharmacy rejected the demo client order and released its reserve.',
        });
      }

      orderDocuments.push({
        _id: orderId,
        userId: clientUser._id,
        pharmacyId: pharmacy._id,
        pharmacySnapshot,
        items: selectedItems,
        totalItems,
        totalPrice,
        currency: 'UAH',
        paymentMethod: orderIndex % 2 === 0 ? 'bank_transfer' : 'cash',
        delivery:
          orderIndex % 2 === 0
            ? {
                method: 'postal_delivery',
                details: {
                  recipientName: client.name,
                  recipientPhone: client.phone,
                  address: client.address,
                },
              }
            : { method: 'pickup' },
        comment: `Demo portfolio order for ${client.name}.`,
        status,
        statusHistory,
        activityHistory: selectedItems.map((item) => ({
          type: 'product_added',
          occurredAt: createdAt,
          changedBy: clientUser._id,
          productId: item.productId,
          productOfferId: item.productOfferId,
          productName: item.productSnapshot.name,
          previousQuantity: 0,
          quantity: item.quantity,
          quantityDelta: item.quantity,
          previousUnitPrice: item.unitPrice,
          unitPrice: item.unitPrice,
        })),

        ...(status === 'rejected'
          ? {
              rejectionReason:
                'The requested combination was unavailable for the selected pickup time. The reservation was released automatically.',
              rejectedAt: finalChangedAt,
              rejectedBy: clientUser._id,
            }
          : {}),
        orderNumber,
        createdAt,
        updatedAt: finalChangedAt,
      });

      selectedItems.forEach((item) => {
        movementPlans.push({
          eventType: 'reserve',
          offerId: item.productOfferId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          orderId,
          orderNumber,
          orderStatus: status === 'new' ? 'new' : 'in_progress',
          comment: `${client.name}'s order reserved ${item.quantity} units.`,
          occurredAt: createdAt,
        });

        if (status === 'successful') {
          movementPlans.push({
            eventType: 'write_off',
            offerId: item.productOfferId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            orderId,
            orderNumber,
            orderStatus: 'successful',
            comment: `Successful order wrote off ${item.quantity} reserved units.`,
            occurredAt: finalChangedAt,
          });
        }

        if (status === 'rejected') {
          movementPlans.push({
            eventType: 'release',
            offerId: item.productOfferId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            orderId,
            orderNumber,
            orderStatus: 'rejected',
            comment: `Rejected order released ${item.quantity} reserved units.`,
            occurredAt: finalChangedAt,
          });
        }
      });
    });
  });

  if (portfolioOrderIndex !== portfolioOrderCount) {
    throw new Error('Portfolio order plan did not cover every client order.');
  }

  await Order.insertMany(orderDocuments);

  const balances = new Map<string, OfferBalance>(
    joinedOffers.map(({ offer }) => [
      String(offer._id),
      {
        total: offer.totalQuantity,
        reserved: offer.reservedQuantity,
        available: offer.availableQuantity,
      },
    ])
  );
  const stockMovements: Array<Record<string, unknown>> = [];

  movementPlans
    .sort(
      (first, second) =>
        first.occurredAt.getTime() - second.occurredAt.getTime()
    )
    .forEach((movement) => {
      const balance = balances.get(String(movement.offerId));
      if (!balance) return;

      let stockDelta = 0;
      let reservedDelta = 0;
      let availableDelta = 0;

      if (movement.eventType === 'reserve') {
        reservedDelta = movement.quantity;
        availableDelta = -movement.quantity;
      } else if (movement.eventType === 'release') {
        reservedDelta = -movement.quantity;
        availableDelta = movement.quantity;
      } else {
        stockDelta = -movement.quantity;
        reservedDelta = -movement.quantity;
      }

      balance.total += stockDelta;
      balance.reserved += reservedDelta;
      balance.available += availableDelta;

      stockMovements.push({
        productOfferId: movement.offerId,
        productId: movement.productId,
        pharmacyId: pharmacy._id,
        eventType: movement.eventType,
        source: 'client_order',
        quantity: movement.quantity,
        stockDelta,
        reservedDelta,
        availableDelta,
        stockAfter: balance.total,
        reservedAfter: balance.reserved,
        availableAfter: balance.available,
        unitPrice: movement.unitPrice,
        orderId: movement.orderId,
        orderNumber: movement.orderNumber,
        orderStatus: movement.orderStatus,
        comment: movement.comment,
        occurredAt: movement.occurredAt,
      });
    });

  if (stockMovements.length > 0) {
    await StockMovement.insertMany(stockMovements);
  }

  await Promise.all(
    [...balances.entries()].map(([offerId, balance]) =>
      ProductOffer.updateOne(
        { _id: offerId },
        {
          $set: {
            totalQuantity: balance.total,
            reservedQuantity: balance.reserved,
            availableQuantity: balance.available,
          },
        },
        { runValidators: true }
      )
    )
  );

  return clientConfigs.length;
}

//===============================================================

async function seedDefaultClientSuccessfulOrders(): Promise<number> {
  const pharmacy = await Pharmacy.findOne({ email: 'care_pharmacy@ukr.net' })
    .select(
      '_id name address city phone email workingHours imageUrl rating reviewsCount bankDetails ownerId activatedAt approvedAt createdAt'
    )
    .lean<
      | (Pick<
          PharmacyEntity,
          | 'name'
          | 'address'
          | 'city'
          | 'phone'
          | 'email'
          | 'workingHours'
          | 'imageUrl'
          | 'rating'
          | 'reviewsCount'
          | 'bankDetails'
          | 'ownerId'
          | 'activatedAt'
          | 'approvedAt'
          | 'createdAt'
        > & { _id: Types.ObjectId })
      | null
    >();

  if (!pharmacy?.ownerId) return 0;

  const defaultClient = await User.findOne({
    isDefaultPharmacyClient: true,
    defaultClientPharmacyId: pharmacy._id,
  })
    .select('_id name')
    .lean<{ _id: Types.ObjectId; name: string } | null>();

  if (!defaultClient) return 0;

  const selloutProducts = await Product.find({
    _id: { $ne: STOCK_MOVEMENT_DEMO_PRODUCT_ID },
  })
    .sort({ article: 1, _id: 1 })
    .limit(4)
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();
  const protectedProductIds = [
    STOCK_MOVEMENT_DEMO_PRODUCT_ID,
    ...selloutProducts.map((product) => product._id),
  ];

  const offers = await ProductOffer.find({
    pharmacyId: pharmacy._id,
    productId: { $nin: protectedProductIds },
  })
    .sort({ productId: 1 })
    .select('_id productId price')
    .lean<
      Array<{
        _id: Types.ObjectId;
        productId: Types.ObjectId;
        price: number;
      }>
    >();

  if (!offers.length) return 0;

  const products = await Product.find({
    _id: { $in: offers.map((offer) => offer.productId) },
    status: 'active',
  })
    .select(
      '_id name slug article category imageUrl manufacturer dosage packageQuantity rating reviewsCount'
    )
    .lean<
      Array<
        Pick<
          ProductEntity,
          | 'name'
          | 'slug'
          | 'article'
          | 'category'
          | 'imageUrl'
          | 'manufacturer'
          | 'dosage'
          | 'packageQuantity'
          | 'rating'
          | 'reviewsCount'
        > & { _id: Types.ObjectId }
      >
    >();

  const productMap = new Map(
    products.map((product) => [String(product._id), product])
  );
  const usableOffers = offers.filter((offer) =>
    productMap.has(String(offer.productId))
  );

  if (!usableOffers.length) return 0;

  const usableOfferIds = usableOffers.map((offer) => offer._id);
  const priceTimeline = await getOfferPriceTimeline(usableOfferIds);

  type ShadowMovement = {
    occurredAt: Date;
    stockDelta: number;
    reservedDelta: number;
    availableDelta: number;
    sequence: number;
  };

  const existingMovements = await StockMovement.find({
    productOfferId: { $in: usableOfferIds },
  })
    .sort({ occurredAt: 1, _id: 1 })
    .select(
      'productOfferId occurredAt stockDelta reservedDelta availableDelta'
    )
    .lean<
      Array<{
        productOfferId: Types.ObjectId;
        occurredAt: Date;
        stockDelta: number;
        reservedDelta: number;
        availableDelta: number;
      }>
    >();

  const shadowMovementsByOfferId = new Map<string, ShadowMovement[]>();

  existingMovements.forEach((movement, index) => {
    const offerId = String(movement.productOfferId);
    const offerMovements = shadowMovementsByOfferId.get(offerId) ?? [];

    offerMovements.push({
      occurredAt: movement.occurredAt,
      stockDelta: movement.stockDelta,
      reservedDelta: movement.reservedDelta,
      availableDelta: movement.availableDelta,
      sequence: index,
    });
    shadowMovementsByOfferId.set(offerId, offerMovements);
  });

  function canScheduleSuccessfulSale(
    offerId: Types.ObjectId,
    createdAt: Date,
    completedAt: Date,
    quantity: number
  ): boolean {
    const offerKey = String(offerId);
    const existing = shadowMovementsByOfferId.get(offerKey) ?? [];
    const candidateSequenceStart = existingMovements.length + orders.length * 2;
    const combined: ShadowMovement[] = [
      ...existing,
      {
        occurredAt: createdAt,
        stockDelta: 0,
        reservedDelta: quantity,
        availableDelta: -quantity,
        sequence: candidateSequenceStart,
      },
      {
        occurredAt: completedAt,
        stockDelta: -quantity,
        reservedDelta: -quantity,
        availableDelta: 0,
        sequence: candidateSequenceStart + 1,
      },
    ].sort(
      (left, right) =>
        left.occurredAt.getTime() - right.occurredAt.getTime() ||
        left.sequence - right.sequence
    );

    let stock = 0;
    let reserved = 0;
    let available = 0;

    for (const movement of combined) {
      stock += movement.stockDelta;
      reserved += movement.reservedDelta;
      available += movement.availableDelta;

      if (
        stock < 0 ||
        reserved < 0 ||
        available < 0 ||
        reserved > stock ||
        available !== stock - reserved
      ) {
        return false;
      }
    }

    return true;
  }

  function addSaleToShadowLedger(
    offerId: Types.ObjectId,
    createdAt: Date,
    completedAt: Date,
    quantity: number
  ) {
    const offerKey = String(offerId);
    const offerMovements = shadowMovementsByOfferId.get(offerKey) ?? [];
    const sequenceStart = existingMovements.length + orders.length * 2;

    offerMovements.push(
      {
        occurredAt: createdAt,
        stockDelta: 0,
        reservedDelta: quantity,
        availableDelta: -quantity,
        sequence: sequenceStart,
      },
      {
        occurredAt: completedAt,
        stockDelta: -quantity,
        reservedDelta: -quantity,
        availableDelta: 0,
        sequence: sequenceStart + 1,
      }
    );
    shadowMovementsByOfferId.set(offerKey, offerMovements);
  }

  const pharmacySnapshot = {
    name: pharmacy.name,
    address: pharmacy.address,
    city: pharmacy.city,
    phone: pharmacy.phone,
    email: pharmacy.email,
    ...(pharmacy.workingHours ? { workingHours: pharmacy.workingHours } : {}),
    ...(pharmacy.imageUrl ? { imageUrl: pharmacy.imageUrl } : {}),
    rating: pharmacy.rating ?? 0,
    reviewsCount: pharmacy.reviewsCount ?? 0,
    bankDetails: pharmacy.bankDetails,
  };

  const orders: Array<Record<string, unknown>> = [];
  const movements: Array<Record<string, unknown>> = [];
  const orderCount = 55;
  const firstOrderAt = new Date('2026-06-20T08:10:00.000Z');
  const rangeDays = 26;

  for (let index = 0; index < orderCount; index += 1) {
    const dayOffset = Math.floor((index * rangeDays) / orderCount);
    const createdAt = new Date(firstOrderAt);
    createdAt.setUTCDate(createdAt.getUTCDate() + dayOffset);
    createdAt.setUTCHours(8 + (index % 10), 10 + ((index * 7) % 45), 0, 0);
    const completedAt = new Date(createdAt.getTime() + 45 * 60 * 1000);
    const preferredQuantity = 1 + (index % 2);

    let offer: (typeof usableOffers)[number] | undefined;
    let quantity = preferredQuantity;

    for (const candidateQuantity of [preferredQuantity, 1]) {
      for (let offset = 0; offset < usableOffers.length; offset += 1) {
        const candidate =
          usableOffers[(index + offset) % usableOffers.length];
        const hasHistoricalPrice = (
          priceTimeline.get(String(candidate._id)) ?? []
        ).some(
          (pricePoint) =>
            pricePoint.occurredAt.getTime() <= createdAt.getTime()
        );

        if (
          hasHistoricalPrice &&
          canScheduleSuccessfulSale(
            candidate._id,
            createdAt,
            completedAt,
            candidateQuantity
          )
        ) {
          offer = candidate;
          quantity = candidateQuantity;
          break;
        }
      }

      if (offer) break;
    }

    if (!offer) {
      throw new Error(
        `Could not allocate inventory for walk-in order ${index + 1} at ${createdAt.toISOString()} without breaking the chronological stock ledger.`
      );
    }

    const product = productMap.get(String(offer.productId));
    if (!product) continue;

    const unitPrice = resolveOfferPriceAt(priceTimeline, offer._id, createdAt);
    addSaleToShadowLedger(offer._id, createdAt, completedAt, quantity);
    const orderId = new Types.ObjectId();
    const orderNumber = createSeedOrderNumber(orderId, createdAt);
    const totalPrice = quantity * unitPrice;
    const productSnapshot = {
      name: product.name,
      ...(product.slug ? { slug: product.slug } : {}),
      article: product.article,
      category: product.category,
      ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
      ...(product.manufacturer
        ? { manufacturer: product.manufacturer }
        : {}),
      ...(product.dosage ? { dosage: product.dosage } : {}),
      ...(product.packageQuantity
        ? { packageQuantity: String(product.packageQuantity) }
        : {}),
      rating: product.rating ?? 0,
      reviewsCount: product.reviewsCount ?? 0,
    };

    orders.push({
      _id: orderId,
      userId: defaultClient._id,
      pharmacyId: pharmacy._id,
      pharmacySnapshot,
      items: [
        {
          productId: product._id,
          productOfferId: offer._id,
          productSnapshot,
          quantity,
          unitPrice,
          totalPrice,
        },
      ],
      totalItems: quantity,
      totalPrice,
      currency: 'UAH',
      paymentMethod: index % 3 === 0 ? 'bank_transfer' : 'cash',
      delivery: { method: 'pickup' },
      comment: `Walk-in counter purchase ${index + 1}.`,
      status: 'successful',
      createdByType: 'manager',
      statusHistory: [
        {
          status: 'in_progress',
          changedAt: createdAt,
          changedBy: pharmacy.ownerId,
          comment: 'Order created by the pharmacy manager for a walk-in customer.',
        },
        {
          status: 'successful',
          changedAt: completedAt,
          changedBy: pharmacy.ownerId,
          comment: 'The counter sale was completed successfully.',
        },
      ],
      activityHistory: [
        {
          type: 'product_added',
          occurredAt: createdAt,
          changedBy: pharmacy.ownerId,
          productId: product._id,
          productOfferId: offer._id,
          productName: product.name,
          previousQuantity: 0,
          quantity,
          quantityDelta: quantity,
          previousUnitPrice: unitPrice,
          unitPrice,
        },
      ],
      orderNumber,
      createdAt,
      updatedAt: completedAt,
    });

    movements.push(
      {
        productOfferId: offer._id,
        productId: product._id,
        pharmacyId: pharmacy._id,
        eventType: 'reserve',
        source: 'client_order',
        quantity,
        stockDelta: 0,
        reservedDelta: quantity,
        availableDelta: -quantity,
        stockAfter: 0,
        reservedAfter: 0,
        availableAfter: 0,
        unitPrice,
        orderId,
        orderNumber,
        orderStatus: 'in_progress',
        comment: `Manager-created walk-in order ${orderNumber} reserved ${quantity} unit${quantity === 1 ? '' : 's'}.`,
        occurredAt: createdAt,
      },
      {
        productOfferId: offer._id,
        productId: product._id,
        pharmacyId: pharmacy._id,
        eventType: 'write_off',
        source: 'client_order',
        quantity,
        stockDelta: -quantity,
        reservedDelta: -quantity,
        availableDelta: 0,
        stockAfter: 0,
        reservedAfter: 0,
        availableAfter: 0,
        unitPrice,
        orderId,
        orderNumber,
        orderStatus: 'successful',
        comment: `Successful walk-in order ${orderNumber} wrote off ${quantity} reserved unit${quantity === 1 ? '' : 's'}.`,
        occurredAt: completedAt,
      }
    );
  }

  await Order.insertMany(orders);
  await StockMovement.insertMany(movements);

  return orders.length;
}

//===============================================================

async function seedSoldOutAndLowStockProducts(): Promise<{
  soldOutProducts: number;
  lowStockProducts: number;
  linkedOrders: number;
}> {
  type SelloutProduct = {
    _id: Types.ObjectId;
    name: string;
    slug?: string;
    article: string;
    category: string;
    imageUrl?: string;
    manufacturer?: string;
    dosage?: string;
    packageQuantity?: string | number;
    rating?: number;
    reviewsCount?: number;
  };

  type SuccessfulOrderSnapshot = {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    orderNumber: string;
    totalItems: number;
    totalPrice: number;
    createdAt: Date;
    updatedAt: Date;
    statusHistory: Array<{
      status: 'new' | 'in_progress' | 'successful' | 'rejected';
      changedAt: Date;
    }>;
  };

  const pharmacy = await Pharmacy.findOne({ email: 'care_pharmacy@ukr.net' })
    .select('_id')
    .lean<{ _id: Types.ObjectId } | null>();

  if (!pharmacy) {
    return { soldOutProducts: 0, lowStockProducts: 0, linkedOrders: 0 };
  }

  const soldOutProducts = await Product.find({
    _id: { $ne: STOCK_MOVEMENT_DEMO_PRODUCT_ID },
  })
    .sort({ article: 1, _id: 1 })
    .limit(4)
    .select(
      '_id name slug article category imageUrl manufacturer dosage packageQuantity rating reviewsCount'
    )
    .lean<SelloutProduct[]>();

  const soldOutOffers = await ProductOffer.find({
    pharmacyId: pharmacy._id,
    productId: { $in: soldOutProducts.map((product) => product._id) },
  }).sort({ productId: 1 });

  if (soldOutOffers.length !== 4) {
    throw new Error('Could not resolve four own products for sellout history.');
  }

  if (soldOutOffers.some((offer) => offer.reservedQuantity !== 0)) {
    throw new Error(
      'Sellout demo products must not be used by active portfolio orders.'
    );
  }

  const successfulOrders = await Order.find({
    pharmacyId: pharmacy._id,
    status: 'successful',
    'items.productId': { $ne: STOCK_MOVEMENT_DEMO_PRODUCT_ID },
  })
    .sort({ createdAt: 1, _id: 1 })
    .limit(40)
    .select(
      '_id userId orderNumber totalItems totalPrice createdAt updatedAt statusHistory'
    )
    .lean<SuccessfulOrderSnapshot[]>();

  if (successfulOrders.length < 40) {
    throw new Error(
      'Forty successful orders are required for sold-out product history.'
    );
  }

  const productsById = new Map<string, SelloutProduct>(
    soldOutProducts.map((product) => [String(product._id), product])
  );
  const selloutPriceTimelineByOfferId = await getOfferPriceTimeline(
    soldOutOffers.map((offer) => offer._id)
  );

  const orderUpdates: Array<Record<string, unknown>> = [];
  const historicalMovements: Array<Record<string, unknown>> = [];

  soldOutOffers.forEach((offer, productIndex) => {
    const product = productsById.get(String(offer.productId));
    if (!product) throw new Error('Sellout product snapshot is missing.');

    const productOrders = successfulOrders.slice(
      productIndex * 10,
      productIndex * 10 + 10
    );
    const baseQuantity = Math.floor(offer.totalQuantity / 10);
    const remainder = offer.totalQuantity % 10;
    let total = offer.totalQuantity;
    let reserved = 0;
    let available = offer.availableQuantity;

    productOrders.forEach((order, orderIndex) => {
      const quantity = baseQuantity + (orderIndex < remainder ? 1 : 0);
      const unitPrice = resolveOfferPriceAt(
        selloutPriceTimelineByOfferId,
        offer._id,
        order.createdAt
      );
      const totalPrice = quantity * unitPrice;
      const productSnapshot = {
        name: product.name,
        ...(product.slug ? { slug: product.slug } : {}),
        article: product.article,
        category: product.category,
        ...(product.imageUrl ? { imageUrl: product.imageUrl } : {}),
        ...(product.manufacturer ? { manufacturer: product.manufacturer } : {}),
        ...(product.dosage ? { dosage: product.dosage } : {}),
        ...(product.packageQuantity
          ? { packageQuantity: String(product.packageQuantity) }
          : {}),
        rating: product.rating ?? 0,
        reviewsCount: product.reviewsCount ?? 0,
      };
      const completedAt =
        [...order.statusHistory]
          .reverse()
          .find((entry) => entry.status === 'successful')?.changedAt ??
        order.updatedAt;

      orderUpdates.push({
        updateOne: {
          filter: { _id: order._id },
          update: {
            $push: {
              items: {
                productId: product._id,
                productOfferId: offer._id,
                productSnapshot,
                quantity,
                unitPrice,
                totalPrice,
              },
              activityHistory: {
                type: 'product_added',
                occurredAt: order.createdAt,
                changedBy: order.userId,
                productId: product._id,
                productOfferId: offer._id,
                productName: product.name,
                previousQuantity: 0,
                quantity,
                quantityDelta: quantity,
                previousUnitPrice: unitPrice,
                unitPrice,
              },
            },
            $inc: { totalItems: quantity, totalPrice },
          },
        },
      });

      reserved += quantity;
      available -= quantity;

      historicalMovements.push({
        productOfferId: offer._id,
        productId: product._id,
        pharmacyId: pharmacy._id,
        eventType: 'reserve',
        source: 'client_order',
        quantity,
        stockDelta: 0,
        reservedDelta: quantity,
        availableDelta: -quantity,
        stockAfter: total,
        reservedAfter: reserved,
        availableAfter: available,
        unitPrice,
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: 'in_progress',
        comment: `Historical order reserved ${quantity} units.`,
        occurredAt: order.createdAt,
      });

      total -= quantity;
      reserved -= quantity;

      historicalMovements.push({
        productOfferId: offer._id,
        productId: product._id,
        pharmacyId: pharmacy._id,
        eventType: 'write_off',
        source: 'client_order',
        quantity,
        stockDelta: -quantity,
        reservedDelta: -quantity,
        availableDelta: 0,
        stockAfter: total,
        reservedAfter: reserved,
        availableAfter: available,
        unitPrice,
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: 'successful',
        comment: `Successful historical order wrote off ${quantity} units.`,
        occurredAt: completedAt,
      });
    });

    if (total !== 0 || reserved !== 0 || available !== 0) {
      throw new Error('Sold-out product balance did not reach zero.');
    }
  });

  if (orderUpdates.length > 0) {
    await Order.bulkWrite(
      orderUpdates as Parameters<typeof Order.bulkWrite>[0]
    );
  }
  if (historicalMovements.length > 0) {
    await StockMovement.insertMany(historicalMovements);
  }

  await Promise.all(
    soldOutOffers.map((offer) =>
      ProductOffer.updateOne(
        { _id: offer._id },
        {
          $set: {
            totalQuantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
          },
        },
        { runValidators: true }
      )
    )
  );

  await Product.updateMany(
    { _id: { $in: soldOutProducts.slice(0, 2).map((product) => product._id) } },
    { $set: { status: 'blocked', inStock: false } }
  );
  await Product.updateMany(
    { _id: { $in: soldOutProducts.slice(2).map((product) => product._id) } },
    { $set: { status: 'active', inStock: false } }
  );

  const soldOutProductIds = soldOutProducts.map((product) => product._id);
  const lowStockProducts = await Product.find({
    _id: {
      $nin: [STOCK_MOVEMENT_DEMO_PRODUCT_ID, ...soldOutProductIds],
    },
    status: 'active',
  })
    .sort({ article: 1, _id: 1 })
    .select('_id')
    .lean<Array<{ _id: Types.ObjectId }>>();

  const lowStockOffers = await ProductOffer.find({
    pharmacyId: pharmacy._id,
    productId: { $in: lowStockProducts.map((product) => product._id) },
    reservedQuantity: { $lte: 4 },
  }).sort({ productId: 1 });

  let lowStockCount = 0;

  for (const offer of lowStockOffers) {
    if (lowStockCount >= 4) break;

    const targetAvailable = 2 + lowStockCount;
    const targetTotal = offer.reservedQuantity + targetAvailable;

    if (targetTotal >= 10 || offer.totalQuantity <= targetTotal) continue;

    const reduction = offer.totalQuantity - targetTotal;

    await StockMovement.create({
      productOfferId: offer._id,
      productId: offer.productId,
      pharmacyId: offer.pharmacyId,
      eventType: 'adjustment',
      source: 'pharmacy_stock',
      quantity: reduction,
      stockDelta: -reduction,
      reservedDelta: 0,
      availableDelta: -reduction,
      stockAfter: targetTotal,
      reservedAfter: offer.reservedQuantity,
      availableAfter: targetAvailable,
      unitPrice: offer.price,
      comment:
        'Inventory reconciliation left fewer than ten units after recent sales.',
      occurredAt: new Date(
        new Date('2026-07-16T16:00:00.000Z').getTime() +
          lowStockCount * 15 * 60 * 1000
      ),
    });

    offer.totalQuantity = targetTotal;
    offer.availableQuantity = targetAvailable;
    await offer.save();

    await Product.updateOne(
      { _id: offer.productId },
      { $set: { status: 'active', inStock: true } }
    );

    lowStockCount += 1;
  }

  return {
    soldOutProducts: soldOutOffers.length,
    lowStockProducts: lowStockCount,
    linkedOrders: orderUpdates.length,
  };
}

//===============================================================

async function reconcileActivePharmacyInventoryLedger(): Promise<number> {
  type LedgerMovement = {
    _id: Types.ObjectId;
    stockDelta: number;
    reservedDelta: number;
    availableDelta: number;
    occurredAt: Date;
    eventType: string;
  };

  const pharmacy = await Pharmacy.findOne({ email: 'care_pharmacy@ukr.net' })
    .select('_id')
    .lean<{ _id: Types.ObjectId } | null>();

  if (!pharmacy) return 0;

  const offers = await ProductOffer.find({ pharmacyId: pharmacy._id })
    .select('_id productId')
    .lean<Array<{ _id: Types.ObjectId; productId: Types.ObjectId }>>();

  let reconciledCount = 0;

  for (const offer of offers) {
    const movements = await StockMovement.find({
      productOfferId: offer._id,
    })
      .sort({ occurredAt: 1, _id: 1 })
      .select(
        '_id stockDelta reservedDelta availableDelta occurredAt eventType'
      )
      .lean<LedgerMovement[]>();

    let totalQuantity = 0;
    let reservedQuantity = 0;
    let availableQuantity = 0;
    const movementUpdates: Array<Record<string, unknown>> = [];

    for (const movement of movements) {
      totalQuantity += movement.stockDelta;
      reservedQuantity += movement.reservedDelta;
      availableQuantity += movement.availableDelta;

      if (
        totalQuantity < 0 ||
        reservedQuantity < 0 ||
        availableQuantity < 0 ||
        reservedQuantity > totalQuantity ||
        availableQuantity !== totalQuantity - reservedQuantity
      ) {
        throw new Error(
          [
            `Invalid inventory ledger for offer ${offer._id.toString()}`,
            `after ${movement.eventType} at ${movement.occurredAt.toISOString()}:`,
            `stock ${totalQuantity}, reserved ${reservedQuantity}, available ${availableQuantity}.`,
          ].join(' ')
        );
      }

      movementUpdates.push({
        updateOne: {
          filter: { _id: movement._id },
          update: {
            $set: {
              stockAfter: totalQuantity,
              reservedAfter: reservedQuantity,
              availableAfter: availableQuantity,
            },
          },
        },
      });
    }

    if (movementUpdates.length > 0) {
      await StockMovement.bulkWrite(
        movementUpdates as Parameters<typeof StockMovement.bulkWrite>[0]
      );
    }

    await ProductOffer.updateOne(
      { _id: offer._id },
      {
        $set: {
          totalQuantity,
          reservedQuantity,
          availableQuantity,
        },
      },
      { runValidators: true }
    );

    const product = await Product.findById(offer.productId)
      .select('status')
      .lean<{ status: string } | null>();

    if (product?.status !== 'blocked') {
      await Product.updateOne(
        { _id: offer.productId },
        { $set: { inStock: availableQuantity > 0 } }
      );
    }

    reconciledCount += 1;
  }

  return reconciledCount;
}

//===============================================================

async function assertDemoOrderStatusCounts(): Promise<void> {
  const pharmacy = await Pharmacy.findOne({ email: 'care_pharmacy@ukr.net' })
    .select('_id')
    .lean<{ _id: Types.ObjectId } | null>();

  if (!pharmacy) throw new Error('Demo pharmacy was not found.');

  const statusCounts = await Order.aggregate<{
    _id: 'new' | 'in_progress' | 'successful' | 'rejected';
    count: number;
  }>([
    { $match: { pharmacyId: pharmacy._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const countByStatus = new Map(
    statusCounts.map((item) => [item._id, item.count])
  );
  const expectedCounts = {
    new: 11,
    in_progress: 9,
    rejected: 7,
  } as const;

  for (const [status, expected] of Object.entries(expectedCounts)) {
    const actual =
      countByStatus.get(status as keyof typeof expectedCounts) ?? 0;

    if (actual !== expected) {
      throw new Error(
        `Unexpected ${status} order count: expected ${expected}, received ${actual}.`
      );
    }
  }
}

//===============================================================

const PRODUCT_MANAGER_NOTE_TEMPLATES = [
  'Clients regularly ask about availability, so check the shelf balance before confirming a large quantity.',
  'Keep the product card details and package information aligned with the latest supplier documents.',
  'The current placement in the pharmacy is convenient; keep the shelf label visible and easy to read.',
  'Monitor the remaining quantity after active orders because this product is often added together with related items.',
  'The product image and article were checked against the received package and are correct.',
  'Before the next restock, compare the supplier price with the current pharmacy selling price.',
  'Several clients asked about an alternative dosage, so mention available substitutes when needed.',
  'Check the expiry dates during the next inventory review and move the nearest dates forward on the shelf.',
  'The product is included in recent orders; confirm the available quantity before approving another reservation.',
  'No packaging issues were noticed during the latest stock check.',
  'Keep the manufacturer information visible when answering client questions about this product.',
  'Review demand after the next completed orders and adjust the planned restock quantity if necessary.',
] as const;

//===============================================================

async function seedOwnProductManagerNotes(): Promise<number> {
  const pharmacy = await Pharmacy.findOne({ email: 'care_pharmacy@ukr.net' })
    .select('_id ownerId managerUserIds')
    .lean<{
      _id: Types.ObjectId;
      ownerId?: Types.ObjectId;
      managerUserIds?: Types.ObjectId[];
    } | null>();

  if (!pharmacy) return 0;

  const createdBy = pharmacy.ownerId ?? pharmacy.managerUserIds?.[0];

  if (!createdBy) return 0;

  const offers = await ProductOffer.find({ pharmacyId: pharmacy._id })
    .sort({ createdAt: 1, productId: 1 })
    .select('productId createdAt')
    .lean<
      Array<{
        productId: Types.ObjectId;
        createdAt: Date;
      }>
    >();

  if (!offers.length) return 0;

  const products = await Product.find({
    _id: { $in: offers.map((offer) => offer.productId) },
  })
    .select('_id name')
    .lean<Array<{ _id: Types.ObjectId; name: string }>>();

  const productNames = new Map(
    products.map((product) => [String(product._id), product.name])
  );

  const latestNoteAt = new Date('2026-07-16T18:00:00.000Z');
  const notes = offers.flatMap((offer, offerIndex) => {
    const notesCount = 10 + (offerIndex % 3);
    const addedAt = new Date(offer.createdAt);
    const firstNoteAt = new Date(addedAt.getTime() + 6 * 60 * 60 * 1000);
    const rangeEnd = Math.max(firstNoteAt.getTime(), latestNoteAt.getTime());
    const step =
      notesCount > 1
        ? Math.floor((rangeEnd - firstNoteAt.getTime()) / (notesCount - 1))
        : 0;
    const productName =
      productNames.get(String(offer.productId)) ?? 'This product';

    return Array.from({ length: notesCount }, (_, noteIndex) => {
      const template =
        PRODUCT_MANAGER_NOTE_TEMPLATES[
          (offerIndex + noteIndex) % PRODUCT_MANAGER_NOTE_TEMPLATES.length
        ];
      const createdAt = new Date(firstNoteAt.getTime() + step * noteIndex);

      return {
        pharmacyId: pharmacy._id,
        entityType: 'product' as const,
        entityId: offer.productId,
        text: `${productName}: ${template}`,
        createdBy,
        createdAt,
        updatedAt: createdAt,
      };
    });
  });

  await PharmacyNote.insertMany(notes);

  return notes.length;
}


const CLIENT_MANAGER_NOTE_TEMPLATES = [
  'Prefers concise updates about order readiness and pickup timing.',
  'Check previous successful purchases before suggesting a replacement product.',
  'Usually confirms the final quantity after the pharmacist explains available alternatives.',
  'Keep delivery and payment preferences aligned with the latest completed order.',
  'No issues were reported during the latest order handoff.',
  'When reserving several items, confirm the expected pickup date in advance.',
  'The purchase history is useful when the client asks for a familiar product again.',
  'Double-check active reservations before approving an additional quantity.',
  'The client appreciates clear information about price changes and package size.',
  'Record any important pickup or communication details in the next order comment.',
  'Review the client order history before offering products from another category.',
  'The latest interaction was completed without additional support requests.',
] as const;

//===============================================================

async function seedClientManagerNotes(): Promise<number> {
  const pharmacy = await Pharmacy.findOne({ email: 'care_pharmacy@ukr.net' })
    .select('_id ownerId managerUserIds approvedAt createdAt')
    .lean<{
      _id: Types.ObjectId;
      ownerId?: Types.ObjectId;
      managerUserIds?: Types.ObjectId[];
      approvedAt?: Date;
      createdAt: Date;
    } | null>();

  if (!pharmacy) return 0;

  const createdBy = pharmacy.ownerId ?? pharmacy.managerUserIds?.[0];
  if (!createdBy) return 0;

  const orders = await Order.find({ pharmacyId: pharmacy._id })
    .sort({ createdAt: 1 })
    .select('userId createdAt')
    .lean<Array<{ userId: Types.ObjectId; createdAt: Date }>>();

  const firstOrderByClientId = new Map<string, Date>();
  for (const order of orders) {
    const clientId = String(order.userId);
    if (!firstOrderByClientId.has(clientId)) {
      firstOrderByClientId.set(clientId, order.createdAt);
    }
  }

  const defaultClient = await User.findOne({
    isDefaultPharmacyClient: true,
    defaultClientPharmacyId: pharmacy._id,
  })
    .select('_id')
    .lean<{ _id: Types.ObjectId } | null>();

  const clientIds = [
    ...firstOrderByClientId.keys(),
    ...(defaultClient ? [String(defaultClient._id)] : []),
  ];

  const clients = await User.find({ _id: { $in: clientIds } })
    .select('_id name isDefaultPharmacyClient')
    .lean<
      Array<{
        _id: Types.ObjectId;
        name: string;
        isDefaultPharmacyClient?: boolean;
      }>
    >();

  const latestNoteAt = new Date('2026-07-16T19:00:00.000Z');
  const notes = clients.flatMap((client, clientIndex) => {
    const notesCount = 10 + (clientIndex % 3);
    const addedAt =
      firstOrderByClientId.get(String(client._id)) ??
      pharmacy.approvedAt ??
      pharmacy.createdAt;
    const firstNoteAt = new Date(addedAt.getTime() + 3 * 60 * 60 * 1000);
    const rangeEnd = Math.max(firstNoteAt.getTime(), latestNoteAt.getTime());
    const step =
      notesCount > 1
        ? Math.floor((rangeEnd - firstNoteAt.getTime()) / (notesCount - 1))
        : 0;

    return Array.from({ length: notesCount }, (_, noteIndex) => {
      const createdAt = new Date(firstNoteAt.getTime() + step * noteIndex);
      const template =
        CLIENT_MANAGER_NOTE_TEMPLATES[
          (clientIndex + noteIndex) % CLIENT_MANAGER_NOTE_TEMPLATES.length
        ];

      return {
        pharmacyId: pharmacy._id,
        entityType: 'client' as const,
        entityId: client._id,
        text: `${client.name}: ${template}`,
        createdBy,
        createdAt,
        updatedAt: createdAt,
      };
    });
  });

  await PharmacyNote.insertMany(notes);
  return notes.length;
}

//===============================================================

const PRODUCT_REQUEST_SEED_NAMES = [
  'Magnesium Citrate Plus',
  'Vitamin D3 Kids Drops',
  'Herbal Throat Spray',
  'Digital Thermometer Flex',
  'Sensitive Skin Cleansing Gel',
  'Omega-3 Forte Capsules',
  'Cooling Eye Mask',
  'Probiotic Balance Complex',
  'Antiseptic Wound Foam',
  'Daily Zinc Lozenges',
  'Joint Support Collagen',
  'Baby Nasal Aspirator',
  'Hydrating Hand Cream',
  'Iron Bisglycinate Tablets',
  'Reusable Hot Cold Pack',
  'Electrolyte Powder Lemon',
  'Calming Herbal Tea',
  'Medical Compression Socks',
  'Face Sunscreen SPF 50',
  'Vitamin B12 Oral Spray',
  'Sleep Support Melatonin',
  'Portable Nebulizer Mini',
  'Dental Floss Mint',
  'Lactase Enzyme Capsules',
  'Sterile Saline Spray',
] as const;

const PRODUCT_REQUEST_SEED_STATUSES = [
  'draft',
  'new',
  'in_progress',
  'approved',
  'rejected',
] as const;

const PRODUCT_REQUEST_SEED_CATEGORIES = [
  'medicine',
  'vitamins',
  'hygiene',
  'medical_devices',
  'beauty',
  'other',
] as const;

//===============================================================

async function seedProductRequests(): Promise<number> {
  const pharmacy = await Pharmacy.findOne({ email: 'care_pharmacy@ukr.net' })
    .select('_id')
    .lean<{ _id: Types.ObjectId } | null>();

  if (!pharmacy) return 0;

  const approvedProducts = await Product.find({ status: 'active' })
    .sort({ createdAt: 1 })
    .limit(5)
    .select('_id name article category manufacturer')
    .lean<
      Array<{
        _id: Types.ObjectId;
        name: string;
        article: string;
        category: (typeof PRODUCT_REQUEST_SEED_CATEGORIES)[number];
        manufacturer?: string;
      }>
    >();

  const baseDate = new Date('2026-06-25T08:30:00.000Z');
  const requests = PRODUCT_REQUEST_SEED_NAMES.map((seedName, index) => {
    const status = PRODUCT_REQUEST_SEED_STATUSES[index % 5];
    const approvedProduct =
      status === 'approved' && approvedProducts.length > 0
        ? approvedProducts[Math.floor(index / 5) % approvedProducts.length]
        : undefined;
    const createdAt = new Date(baseDate.getTime() + index * 24 * 60 * 60 * 1000);
    const category =
      approvedProduct?.category ??
      PRODUCT_REQUEST_SEED_CATEGORIES[
        index % PRODUCT_REQUEST_SEED_CATEGORIES.length
      ];
    const name = approvedProduct?.name ?? seedName;
    const article =
      approvedProduct?.article ?? `REQ-${String(index + 1).padStart(4, '0')}`;

    return {
      pharmacyId: pharmacy._id,
      name,
      article,
      category,
      status,
      productId: approvedProduct?._id,
      manufacturer:
        approvedProduct?.manufacturer ??
        ['Medica Nova', 'HealthLab', 'CareLine', 'VitaWorks'][index % 4],
      countryOfOrigin: ['Ukraine', 'Poland', 'Germany', 'Italy'][index % 4],
      dosage: index % 3 === 0 ? '500 mg' : index % 3 === 1 ? '10 ml' : '1 unit',
      packageSize: index % 2 === 0 ? '№30' : '100 ml',
      form: ['tablets', 'spray', 'capsules', 'medical device'][index % 4],
      activeSubstance:
        category === 'medical_devices' ? undefined : `Active component ${index + 1}`,
      prescriptionType:
        category === 'medicine' ? 'non_prescription' : 'not_applicable',
      storageConditions: 'Store in a dry place below 25°C and keep away from direct sunlight.',
      shortDescription: `${name} is a demo product submitted by the pharmacy for catalog review.`,
      fullDescription:
        'The request contains sample product data for checking the pharmacy request list, filters, pagination, and moderation statuses.',
      characteristics:
        'Demo package information, composition, dosage form, and storage requirements.',
      pharmacyComment:
        status === 'rejected'
          ? 'Please review the package information and manufacturer documents before creating a new request based on this one.'
          : 'The product is planned for the pharmacy assortment and is not currently available in the global catalog.',
      additionalFiles:
        index % 4 === 0
          ? [
              {
                name: `product-document-${index + 1}.pdf`,
                type: 'application/pdf',
                size: 245000 + index * 1000,
              },
            ]
          : undefined,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + (index % 3) * 60 * 60 * 1000),
    };
  });

  await ProductRequest.insertMany(requests);
  return requests.length;
}

//===============================================================

async function removeSeededDefaultPharmacyClients(): Promise<void> {
  const defaultClientIds = await User.find({
    isDefaultPharmacyClient: true,
  }).distinct('_id');

  if (!defaultClientIds.length) return;

  await Promise.all([
    Client.deleteMany({ userId: { $in: defaultClientIds } }),
    User.deleteMany({ _id: { $in: defaultClientIds } }),
  ]);
}

//===============================================================

async function seedDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed script is blocked in production');
  }

  await connectDB();
  await removeSeededDefaultPharmacyClients();

  await Promise.all([
    Pharmacy.deleteMany({}),
    Product.deleteMany({}),
    ProductOffer.deleteMany({}),
    ProductReview.deleteMany({}),
    PharmacyReview.deleteMany({}),
    Order.deleteMany({}),
    Cart.deleteMany({}),
    StockMovement.deleteMany({}),
    PharmacyNote.deleteMany({}),
    ProductRequest.deleteMany({}),
  ]);

  const pharmacySeeds = createSeedPharmacies();
  const createdPharmacies = (await Pharmacy.insertMany(
    pharmacySeeds.map(({ reviews, ...pharmacy }) => {
      void reviews;
      return pharmacy;
    })
  )) as SeedPharmacyDocument[];

  await PharmacyReview.insertMany(
    createdPharmacies.flatMap((pharmacy, index) =>
      pharmacySeeds[index].reviews.map((review) => ({
        ...review,
        pharmacyId: pharmacy._id,
      }))
    )
  );

  const seedProducts = createSeedProducts(createdPharmacies);
  const createdProducts = await Product.insertMany(
    seedProducts.map(({ offers, reviews, ...product }) => {
      void offers;
      void reviews;
      return product;
    })
  );

  const createdProductOffers = await ProductOffer.insertMany(
    createdProducts.flatMap((product, index) =>
      seedProducts[index].offers.map((offer) => ({
        productId: product._id,
        pharmacyId: offer.pharmacyId,
        price: offer.price,
        totalQuantity: offer.totalQuantity,
        availableQuantity: offer.availableQuantity,
        reservedQuantity: offer.reservedQuantity,
      }))
    )
  );

  await StockMovement.insertMany(
    createdProductOffers.map((offer) => ({
      productOfferId: offer._id,
      productId: offer.productId,
      pharmacyId: offer.pharmacyId,
      eventType: 'arrival',
      source: 'pharmacy_stock',
      stockDelta: offer.totalQuantity,
      reservedDelta: 0,
      availableDelta: offer.availableQuantity,
      stockAfter: offer.totalQuantity,
      reservedAfter: offer.reservedQuantity,
      availableAfter: offer.availableQuantity,
      unitPrice: offer.price,
      comment: 'Initial stock quantity added to the pharmacy warehouse.',
      occurredAt: offer.createdAt,
    }))
  );

  await ProductReview.insertMany(
    createdProducts.flatMap((product, index) =>
      seedProducts[index].reviews.map((review) => ({
        ...review,
        productId: product._id,
      }))
    )
  );

  const pharmacyAccountsCount = await seedPharmacyAccounts();
  const activePharmacyOffersCount = await seedActivePharmacyProductOffers(
    createdProducts as Array<{
      _id: Types.ObjectId;
      status: string;
      price: number;
    }>
  );
  const restockedOffersCount = await seedOwnProductRestocks();

  console.log(`Seed completed: ${createdPharmacies.length} pharmacies created`);
  console.log(`Seed completed: ${seedProducts.length} products created`);
  console.log(
    `Seed completed: ${pharmacyAccountsCount} pharmacy accounts created`
  );
  const activePharmacyOrdersCount = await seedActivePharmacyOrder();
  const pharmacyClientsCount = await seedPharmacyClientPortfolio();
  const defaultClientOrdersCount = await seedDefaultClientSuccessfulOrders();

  // Bring ProductOffer balances in sync with all order movements before the
  // sold-out and low-stock demo scenarios calculate their final adjustments.
  // Otherwise those scenarios would use the original seeded quantities and
  // could subtract stock that the walk-in orders had already sold.
  await reconcileActivePharmacyInventoryLedger();

  const inventoryScenario = await seedSoldOutAndLowStockProducts();
  const reconciledOffersCount = await reconcileActivePharmacyInventoryLedger();

  const productRequestsCount = await seedProductRequests();
  const productManagerNotesCount = await seedOwnProductManagerNotes();
  const clientManagerNotesCount = await seedClientManagerNotes();
  await assertDemoOrderStatusCounts();

  console.log(
    `Seed completed: ${activePharmacyOffersCount} active pharmacy offers created`
  );
  console.log(
    `Seed completed: ${restockedOffersCount} own products restocked and repriced`
  );

  console.log(
    `Seed completed: ${activePharmacyOrdersCount} active pharmacy orders created`
  );

  console.log(
    `Seed completed: ${pharmacyClientsCount} pharmacy client profiles created`
  );
  console.log(
    `Seed completed: ${defaultClientOrdersCount} successful walk-in customer orders created`
  );
  console.log(
    `Seed completed: ${inventoryScenario.soldOutProducts} sold-out products, ${inventoryScenario.lowStockProducts} low-stock products, and ${inventoryScenario.linkedOrders} successful orders linked to sellout history`
  );
  console.log(
    `Seed completed: ${reconciledOffersCount} inventory ledgers reconciled chronologically`
  );
  console.log(
    `Seed completed: ${productRequestsCount} product requests created`
  );
  console.log(
    `Seed completed: ${productManagerNotesCount} product manager comments created`
  );
  console.log(
    `Seed completed: ${clientManagerNotesCount} client manager comments created`
  );
}

//===============================================================

seedDatabase()
  .catch((error) => {
    console.error('Seed failed');

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
