import mongoose, { type Types } from 'mongoose';

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
import { hashPassword } from '../utils/password';

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
  totalQuantity: number,
  reservedQuantity = 0
) {
  const availableQuantity = Math.max(totalQuantity - reservedQuantity, 0);

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
const PHARMACY_ACCOUNT_DESCRIPTION_LENGTH = 5000;
const PHARMACY_ACCOUNT_FALLBACK_IMAGE_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p94AAAAASUVORK5CYII=';

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
            ? { approvedBy: user._id, approvedAt: new Date() }
            : {}),
          updatedBy: user._id,
        },
        $unset: {
          pendingModeration: '',
          ...(seed.statusReason ? {} : { statusReason: '' }),
          ...(seed.status === PHARMACY_STATUSES.ACTIVE
            ? {}
            : { approvedBy: '', approvedAt: '' }),
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

    if (pharmacy) createdCount += 1;
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
                : 12 + ((index + offerIndex) % 48),
              shouldForceRichStock && offerIndex < 10 ? 0 : offerIndex % 4
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

  await ProductOffer.deleteMany({ pharmacyId: activePharmacy._id });

  await ProductOffer.insertMany(
    activeProducts.map((product, index) => {
      const lowStockQuantities = [5, 7, 8, 10];
      const quantity =
        index < 4
          ? 0
          : index < 8
            ? lowStockQuantities[index - 4]
            : 100 + index * 3;

      return {
        productId: product._id,
        pharmacyId: activePharmacy._id,
        price: product.price > 0 ? product.price : 100 + index * 10,
        totalQuantity: quantity,
        availableQuantity: quantity,
        reservedQuantity: 0,
      };
    })
  );

  return activeProducts.length;
}

//===============================================================

async function seedActivePharmacyOrder(): Promise<number> {
  type SeedPharmacyLean = {
    _id: unknown;
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    imageUrl?: string;
    rating?: number;
    reviewsCount?: number;
    bankDetails?: unknown;
  };

  type SeedProductOfferLean = {
    _id: unknown;
    productId: unknown;
    price: number;
    availableQuantity: number;
  };

  type SeedProductLean = {
    _id: unknown;
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

  type SeedOrderItem = {
    productId: unknown;
    productOfferId: unknown;
    productSnapshot: {
      name: string;
      slug?: string;
      article: string;
      category: string;
      imageUrl?: string;
      manufacturer?: string;
      dosage?: string;
      packageQuantity?: string | number;
      rating: number;
      reviewsCount: number;
    };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  };

  const pharmacy = await Pharmacy.findOne({ email: 'care_pharmacy@ukr.net' })
    .select(
      '_id name address city phone email imageUrl rating reviewsCount bankDetails'
    )
    .lean<SeedPharmacyLean | null>();

  if (!pharmacy) return 0;

  const password = await hashPassword('123456789');
  const clientUser = await User.findOneAndUpdate(
    { email: 'nata.client@ukr.net' },
    {
      $set: {
        name: 'Nata',
        email: 'nata.client@ukr.net',
        password,
        role: USER_ROLES.CLIENT,
        status: USER_STATUSES.ACTIVE,
        phone: '+380968016907',
        address: '27 Wellness Street, Lviv, Lviv',
        pictureUrl: '/images/seed/pharmacies/pharmacy-005.png',
      },
    },
    {
      returnDocument: 'after',
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  await Client.findOneAndUpdate(
    { userId: clientUser._id },
    {
      $setOnInsert: {
        userId: clientUser._id,
        favoriteProductIds: [],
        favoritePharmacyIds: [],
      },
    },
    { upsert: true, runValidators: true }
  );

  await Promise.all([
    Order.deleteMany({ pharmacyId: pharmacy._id }),
    Cart.deleteMany({ clientUserId: clientUser._id }),
  ]);

  const offers = await ProductOffer.find({
    pharmacyId: pharmacy._id,
    availableQuantity: { $gt: 0 },
  })
    .sort({ createdAt: 1 })
    .limit(16)
    .lean<SeedProductOfferLean[]>();

  if (!offers.length) return 0;

  const products = await Product.find({
    _id: { $in: offers.map((offer) => offer.productId) },
  }).lean<SeedProductLean[]>();

  const productMap = new Map(
    products.map((product) => [String(product._id), product])
  );

  const quantities = [3, 3, 2, 4, 1, 3, 3, 2, 3, 1, 2, 2, 1, 5, 1, 6];

  const items = offers
    .map((offer, index): SeedOrderItem | null => {
      const product = productMap.get(String(offer.productId));
      const quantity = Math.min(
        quantities[index] ?? 1,
        offer.availableQuantity
      );

      if (!product) return null;

      return {
        productId: offer.productId,
        productOfferId: offer._id,
        productSnapshot: {
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
            ? { packageQuantity: product.packageQuantity }
            : {}),
          rating: product.rating ?? 0,
          reviewsCount: product.reviewsCount ?? 0,
        },
        quantity,
        unitPrice: offer.price,
        totalPrice: quantity * offer.price,
      };
    })
    .filter((item): item is SeedOrderItem => item !== null);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const createdAt = new Date('2026-07-09T14:33:13.000Z');

  for (const item of items) {
    await ProductOffer.updateOne(
      { _id: item.productOfferId },
      {
        $inc: {
          availableQuantity: -item.quantity,
          reservedQuantity: item.quantity,
        },
      },
      { runValidators: true }
    );
  }

  await Order.create({
    userId: clientUser._id,
    pharmacyId: pharmacy._id,
    pharmacySnapshot: {
      name: pharmacy.name,
      address: pharmacy.address,
      city: pharmacy.city,
      phone: pharmacy.phone,
      email: pharmacy.email,
      imageUrl: pharmacy.imageUrl,
      rating: pharmacy.rating ?? 0,
      reviewsCount: pharmacy.reviewsCount ?? 0,
      bankDetails: pharmacy.bankDetails,
    },
    items,
    totalItems,
    totalPrice,
    currency: 'UAH',
    paymentMethod: 'bank_transfer',
    delivery: {
      method: 'postal_delivery',
      details: {
        recipientName: 'Nata',
        recipientPhone: '+380968016907',
        address: '27 Wellness Street, Lviv, Lviv',
      },
    },
    comment:
      'Pharmacy products are non-returnable and non-exchangeable after confirmation. Please check the order carefully before payment.',
    status: 'new',
    statusHistory: [
      {
        status: 'new',
        changedAt: createdAt,
        changedBy: clientUser._id,
      },
    ],
    orderNumber: 'EP-20260709-173313-BOECC9FC',
    createdAt,
    updatedAt: createdAt,
  });

  return 1;
}

//===============================================================

async function seedDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed script is blocked in production');
  }

  await connectDB();

  await Promise.all([
    Pharmacy.deleteMany({}),
    Product.deleteMany({}),
    ProductOffer.deleteMany({}),
    ProductReview.deleteMany({}),
    PharmacyReview.deleteMany({}),
    Order.deleteMany({}),
    Cart.deleteMany({}),
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

  await ProductOffer.insertMany(
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

  console.log(`Seed completed: ${createdPharmacies.length} pharmacies created`);
  console.log(`Seed completed: ${seedProducts.length} products created`);
  console.log(
    `Seed completed: ${pharmacyAccountsCount} pharmacy accounts created`
  );
  const activePharmacyOrdersCount = await seedActivePharmacyOrder();

  console.log(
    `Seed completed: ${activePharmacyOffersCount} active pharmacy offers created`
  );
  console.log(
    `Seed completed: ${activePharmacyOrdersCount} active pharmacy orders created`
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
