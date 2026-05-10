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
  ['Paracetamol Forte 500 mg tablets', 'medicine', 'MedCare', '500 mg', '20 tablets'],
  ['Ibuprofen Rapid 200 mg capsules', 'medicine', 'PharmaLine', '200 mg', '20 capsules'],
  ['Loratadine Allergy Relief 10 mg tablets', 'medicine', 'AllergoHelp', '10 mg', '10 tablets'],
  ['Drotaverine Comfort 40 mg tablets', 'medicine', 'CareLabs', '40 mg', '24 tablets'],
  ['Ambroxol Cough Syrup 30 mg bottle', 'medicine', 'BronchoCare', '30 mg/5 ml', '100 ml'],
  ['Vitamin C Plus Zinc effervescent tablets', 'vitamins', 'VitaLife', '1000 mg', '20 tablets'],
  ['Vitamin D3 Daily 2000 IU softgels', 'vitamins', 'SunVita', '2000 IU', '60 softgels'],
  ['Magnesium B6 Complex tablets', 'vitamins', 'NeuroVita', '400 mg', '60 tablets'],
  ['Omega 3 Premium fish oil capsules', 'vitamins', 'Nordic Care', '1000 mg', '90 capsules'],
  ['Probiotic Balance capsules', 'vitamins', 'GutCare', '10 billion CFU', '30 capsules'],
  ['Digital Thermometer Flex Tip', 'medical-devices', 'HealthTech', undefined, '1 device'],
  ['Automatic Blood Pressure Monitor', 'medical-devices', 'CardioCheck', undefined, '1 device'],
  ['Pulse Oximeter Finger Monitor', 'medical-devices', 'OxyCare', undefined, '1 device'],
  ['Nebulizer Compact Home Care', 'medical-devices', 'BreathWell', undefined, '1 device'],
  ['Glucose Test Strips Universal', 'medical-devices', 'GlucoSafe', undefined, '50 strips'],
  ['Antiseptic Spray Chlorhexidine', 'hygiene', 'CleanMed', undefined, '100 ml'],
  ['Medical Face Masks three layer', 'hygiene', 'SafeMask', undefined, '50 masks'],
  ['Hand Sanitizer Aloe Vera', 'hygiene', 'CleanHands', undefined, '250 ml'],
  ['Sterile Bandage Set', 'hygiene', 'FirstAid', undefined, '10 pcs'],
  ['Saline Nasal Spray Gentle', 'hygiene', 'NasoCare', undefined, '50 ml'],
  ['Moisturizing Hand Cream Urea', 'beauty', 'SoftCare', undefined, '75 ml'],
  ['Sunscreen SPF 50 Sensitive Skin', 'beauty', 'DermaSun', undefined, '100 ml'],
  ['Lip Balm Panthenol Repair', 'beauty', 'DermaSoft', undefined, '4.8 g'],
  ['Face Cleansing Gel Sensitive', 'beauty', 'SkinBalance', undefined, '200 ml'],
  ['Thermal Water Spray', 'beauty', 'AquaDerm', undefined, '150 ml'],
  ['First Aid Travel Kit', 'other', 'TravelMed', undefined, '1 kit'],
  ['Reusable Hot and Cold Gel Pack', 'other', 'ComfortAid', undefined, '1 pack'],
  ['Pill Organizer Weekly Box', 'other', 'DailyDose', undefined, '1 organizer'],
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

function createImageUrl(type: 'product' | 'store', index: number): string {
  return `https://picsum.photos/seed/e-pharmacy-${type}-${index}/1200/900`;
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
      rating: Number((4 + (index % 10) * 0.1).toFixed(1)),
      imageUrl: createImageUrl('store', storeNumber),
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
    const [baseName, category, manufacturer, dosage, packageQuantity] =
      PRODUCT_BLUEPRINTS[index % PRODUCT_BLUEPRINTS.length];
    const name = `${baseName} ${productNumber > PRODUCT_BLUEPRINTS.length ? `№${productNumber}` : ''}`.trim();
    const isPremium = index % 6 === 0 || index % 11 === 0;
    const basePrice = isPremium
      ? 1050 + ((index * 137) % 2450)
      : 75 + ((index * 29) % 780);
    const offersCount = index % 10 === 0 ? 25 : 2 + (index % 5);
    const selectedStores = Array.from({ length: offersCount }, (_, offerIndex) =>
      stores[(index * 3 + offerIndex) % stores.length]
    );
    const isSoldOut = index % 17 === 0;
    const offers = isSoldOut
      ? []
      : selectedStores.map((store, offerIndex) =>
          createOffer(
            store,
            basePrice + offerIndex * (7 + (index % 5)),
            12 + ((index + offerIndex) % 48),
            offerIndex % 4
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
      imageUrl: createImageUrl('product', productNumber),
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
