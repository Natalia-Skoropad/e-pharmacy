import mongoose, { type Types } from 'mongoose';

import { connectDB } from '../db/connectDB';
import { Product } from '../models/product.model';
import { Store } from '../models/store.model';

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

const REVIEW_COMMENTS = [
  'The order was processed quickly, the product page had clear details, and the pharmacy staff explained the pickup process very politely. I liked that the information about availability matched the real stock, so there were no surprises when I arrived. Packaging was neat, the receipt was ready, and the overall experience felt reliable. This is exactly the kind of service I want to see in an online pharmacy catalog when comparing offers, prices, and nearby stores before making a purchase.',
  'I was checking several options and this one looked the most convenient because the description, price, rating, and pharmacy information were easy to understand. The product was prepared on time, the staff answered my questions calmly, and the checkout flow felt simple. Long reviews like this are helpful for testing the layout too: the card should stay readable, the spacing should not collapse, and the text should wrap naturally without breaking the design on mobile, tablet, or desktop screens.',
  'Very good experience from search to pickup. The catalog helped me compare similar products, the rating looked realistic, and the pharmacy page showed useful address and phone details. The item was available exactly as shown, which is important when someone needs medicine quickly. I also liked that the review section is not too cramped, because longer feedback gives more context and makes the interface feel closer to a real marketplace with many active customers.',
  'The product name, package size, and price were clear, and the pharmacy had enough stock when I came to collect the order. I usually pay attention to reviews before choosing a store, so it is useful to see detailed feedback instead of one short sentence. This comment intentionally has many words to check how five hundred character reviews behave inside cards, lists, tabs, lazy loading blocks, and responsive layouts without creating awkward gaps or visual noise.',
];

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

const STORE_BRANDS = [
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

const PRODUCT_BLUEPRINTS = [
  ['Aspirin', 'medicine', 'Square', '500 mg', '№30 (10x3)', '/images/seed/products/product-001.png'],
  ['Paracetamol', 'medicine', 'Acme', '500 mg', '№20 (10x2)', '/images/seed/products/product-002.png'],
  ['Ibuprofen', 'medicine', 'Beximco', '200 mg', '№28 (14x2)', '/images/seed/products/product-003.png'],
  ['Acetaminophen', 'hygiene', 'ACI', '500 mg', '№10', '/images/seed/products/product-004.png'],
  ['Naproxen', 'beauty', 'Uniliver', '250 mg', '№60', '/images/seed/products/product-005.png'],
  ['Loratadine', 'medicine', 'Square', '10 mg', '№100', '/images/seed/products/product-006.png'],
  ['Atorvastatin', 'medicine', 'Acme', '20 mg', '№30 (10x3)', '/images/seed/products/product-007.png'],
  ['Omeprazole', 'medicine', 'Beximco', '20 mg', '№20 (10x2)', '/images/seed/products/product-008.png'],
  ['Simvastatin', 'hygiene', 'ACI', '20 mg', '№28 (14x2)', '/images/seed/products/product-009.png'],
  ['Metformin', 'beauty', 'Uniliver', '500 mg', '№10', '/images/seed/products/product-010.png'],
  ['Warfarin', 'medicine', 'Square', '5 mg', '№60', '/images/seed/products/product-011.png'],
  ['Fluoxetine', 'medicine', 'Acme', '20 mg', '№100', '/images/seed/products/product-012.png'],
  ['Lisinopril', 'medicine', 'Beximco', '10 mg', '№30 (10x3)', '/images/seed/products/product-013.png'],
  ['Metoprolol', 'hygiene', 'ACI', '50 mg', '№20 (10x2)', '/images/seed/products/product-014.png'],
  ['Amlodipine', 'beauty', 'Uniliver', '5 mg', '№28 (14x2)', '/images/seed/products/product-015.png'],
  ['Citalopram', 'medicine', 'Square', '20 mg', '№10', '/images/seed/products/product-016.png'],
  ['Metronidazole', 'medicine', 'Acme', '500 mg', '№60', '/images/seed/products/product-017.png'],
  ['Carvedilol', 'medicine', 'Beximco', '12.5 mg', '№100', '/images/seed/products/product-018.png'],
  ['Clopidogrel', 'hygiene', 'ACI', '75 mg', '№30 (10x3)', '/images/seed/products/product-019.png'],
  ['Levothyroxine', 'beauty', 'Uniliver', '50 mcg', '№20 (10x2)', '/images/seed/products/product-020.png'],
  ['Ramipril', 'medicine', 'Square', '5 mg', '№28 (14x2)', '/images/seed/products/product-021.png'],
  ['Amitriptyline', 'medicine', 'Acme', '25 mg', '№10', '/images/seed/products/product-022.png'],
  ['Losartan', 'medicine', 'Beximco', '50 mg', '№60', '/images/seed/products/product-023.png'],
  ['Montelukast', 'hygiene', 'ACI', '10 mg', '№100', '/images/seed/products/product-024.png'],
  ['Hydrochlorothiazide', 'beauty', 'Uniliver', '25 mg', '№30 (10x3)', '/images/seed/products/product-025.png'],
  ['Meloxicam', 'medicine', 'Square', '15 mg', '№20 (10x2)', '/images/seed/products/product-026.png'],
  ['Amlodipine', 'medicine', 'Acme', '5 mg', '№28 (14x2)', '/images/seed/products/product-027.png'],
  ['Citalopram', 'medicine', 'Beximco', '20 mg', '№10', '/images/seed/products/product-028.png'],
  ['Atorvastatin', 'hygiene', 'ACI', '20 mg', '№60', '/images/seed/products/product-029.png'],
  ['Warfarin', 'beauty', 'Uniliver', '5 mg', '№100', '/images/seed/products/product-030.png'],
] as const;

//===============================================================

type SeedStoreDocument = {
  _id: Types.ObjectId;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  rating?: number;
  imageUrl?: string;
};

//===============================================================

const STORE_IMAGE_URLS = [
  '/images/seed/stores/store-001.png',
  '/images/seed/stores/store-002.png',
  '/images/seed/stores/store-003.png',
  '/images/seed/stores/store-004.png',
  '/images/seed/stores/store-005.png',
  '/images/seed/stores/store-006.png',
  '/images/seed/stores/store-007.png',
  '/images/seed/stores/store-008.png',
  '/images/seed/stores/store-009.png',
  '/images/seed/stores/store-010.png',
  '/images/seed/stores/store-011.png',
  '/images/seed/stores/store-012.png',
  '/images/seed/stores/store-013.png',
  '/images/seed/stores/store-014.png',
  '/images/seed/stores/store-015.png',
  '/images/seed/stores/store-016.png',
  '/images/seed/stores/store-017.png',
  '/images/seed/stores/store-018.png',
  '/images/seed/stores/store-019.png',
  '/images/seed/stores/store-020.png',
] as const;

function createStoreImageUrl(index: number): string {
  return STORE_IMAGE_URLS[index % STORE_IMAGE_URLS.length];
}

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

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function createModeratedReview(index: number, preferredRating?: number) {
  return {
    userName: REVIEW_AUTHORS[index % REVIEW_AUTHORS.length],
    rating: preferredRating ?? ((index % 5) + 1),
    comment: REVIEW_COMMENTS[index % REVIEW_COMMENTS.length],
    isModerated: true,
    moderatedAt: new Date(
      `2026-04-${String(1 + (index % 25)).padStart(2, '0')}T10:00:00.000Z`
    ),
    createdAt: new Date(
      `2026-04-${String(1 + (index % 25)).padStart(2, '0')}T09:00:00.000Z`
    ),
  };
}

function createModeratedReviews(count: number, ratingBase = 4) {
  return Array.from({ length: count }, (_, index) =>
    createModeratedReview(index, Math.min(5, ratingBase + (index % 2)))
  );
}

function createOffer(
  store: SeedStoreDocument,
  price: number,
  totalQuantity: number,
  reservedQuantity = 0
) {
  const activeQuantity = Math.max(totalQuantity - reservedQuantity, 0);

  return {
    storeId: store._id,
    storeName: store.name,
    storeCity: store.city,
    storeAddress: store.address,
    storePhone: store.phone,
    storeImageUrl: store.imageUrl,
    storeRating: store.rating,
    storeReviewsCount: 18 + (price % 17),
    price,
    totalQuantity,
    activeQuantity,
    reservedQuantity,
    inStock: activeQuantity > 0,
  };
}

function createSeedStores() {
  return Array.from({ length: 98 }, (_, index) => {
    const storeNumber = index + 1;
    const city = CITIES[index % CITIES.length];
    const brand = STORE_BRANDS[index % STORE_BRANDS.length];
    const street = STREETS[index % STREETS.length];
    const reviewsCount = index < 34 ? 26 + (index % 9) : 6 + (index % 18);

    return {
      name: `${brand} ${city} ${storeNumber}`,
      address: `${12 + index} ${street}`,
      city,
      phone: `+380${String(501000000 + storeNumber).padStart(9, '0')}`,
      email: `store.${storeNumber}@e-pharmacy.example.com`,
      workingHours: 'Mon–Fri 08:00–21:00, Sat–Sun 09:00–18:00',
      rating: Number((4 + (index % 10) * 0.1).toFixed(1)),
      imageUrl: createStoreImageUrl(index),
      description: `${brand} in ${city} offers everyday medicines, vitamins, medical devices, hygiene products, and quick online reservation for local customers.`,
      isActive: true,
      reviewsCount,
      reviews: createModeratedReviews(reviewsCount, 4),
    };
  });
}

function createSeedProducts(stores: SeedStoreDocument[]) {
  return Array.from({ length: 126 }, (_, index) => {
    const productNumber = index + 1;
    const [baseName, category, manufacturer, dosage, packageQuantity, imageUrl] =
      PRODUCT_BLUEPRINTS[index % PRODUCT_BLUEPRINTS.length];
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
    const selectedStores = Array.from({ length: offersCount }, (_, offerIndex) =>
      stores[(index * 3 + offerIndex) % stores.length]
    );
    const isSoldOut = index % 17 === 0;
    const richStockStores = index < 115 ? stores.slice(0, 10) : [];
    const mergedStores = [
      ...richStockStores,
      ...selectedStores.filter(
        (store) =>
          !richStockStores.some(
            (richStore) => richStore._id.toString() === store._id.toString()
          )
      ),
    ];
    const shouldForceRichStock = index < 115;
    const offers = isSoldOut && !shouldForceRichStock
      ? []
      : mergedStores.map((store, offerIndex) =>
          createOffer(
            store,
            basePrice + offerIndex * (7 + (index % 5)),
            shouldForceRichStock && offerIndex < 10
              ? 40 + ((index + offerIndex) % 35)
              : 12 + ((index + offerIndex) % 48),
            shouldForceRichStock && offerIndex < 10 ? 0 : offerIndex % 4
          )
        );
    const reviewsCount =
      index < 38 ? 18 + (index % 16) : index % 4 === 0 ? 10 + (index % 8) : index % 9;
    const rating = Number((4 + (index % 11) * 0.09).toFixed(1));

    return {
      name,
      slug: createSlug(name),
      article: `EPH-${String(productNumber).padStart(4, '0')}`,
      description: `${name} is a realistic demo catalog item for testing product cards, price formatting, long review text, filters, sorting, pharmacy availability, and responsive catalog layouts.`,
      category,
      price: offers.length > 0 ? basePrice : 0,
      imageUrl,
      manufacturer,
      dosage,
      packageQuantity,
      storeId: offers[0]?.storeId,
      storeName: offers[0]?.storeName,
      offers,
      inStock: offers.some((offer) => offer.inStock),
      rating,
      reviewsCount,
      reviews: createModeratedReviews(reviewsCount, 4),
    };
  });
}

//===============================================================

async function seedDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed script is blocked in production');
  }

  await connectDB();

  await Promise.all([Store.deleteMany({}), Product.deleteMany({})]);

  const createdStores = (await Store.insertMany(
    createSeedStores()
  )) as SeedStoreDocument[];

  const seedProducts = createSeedProducts(createdStores);

  await Product.insertMany(seedProducts);

  console.log(`Seed completed: ${createdStores.length} stores created`);
  console.log(`Seed completed: ${seedProducts.length} products created`);
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
