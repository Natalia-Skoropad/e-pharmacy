import mongoose, { type Types } from 'mongoose';

import { connectDB } from '../db/connectDB';
import { Product } from '../models/product.model';
import { Store } from '../models/store.model';

//===============================================================

const STORE_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1576602976047-174e57a47881?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1585435557343-3b348031e799?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=1200&auto=format&fit=crop',
];

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
];

const REVIEW_COMMENTS = [
  'Fast pickup and clear product information.',
  'Good service and helpful pharmacy staff.',
  'The product matched the description.',
  'Ordering was simple and convenient.',
  'Nice price compared with nearby pharmacies.',
  'Everything was packed well and ready on time.',
];

const seedStores = [
  {
    name: 'Green Pharmacy',
    address: '15 Khreshchatyk Street',
    city: 'Kyiv',
    phone: '+380441112233',
    email: 'green.pharmacy@example.com',
    rating: 4.8,
    imageUrl: STORE_IMAGE_URLS[0],
    description:
      'A modern pharmacy with a wide range of medicines, vitamins, and healthcare products.',
    isActive: true,
  },
  {
    name: 'Health Plus',
    address: '42 Soborna Avenue',
    city: 'Lviv',
    phone: '+380322223344',
    email: 'health.plus@example.com',
    rating: 4.6,
    imageUrl: STORE_IMAGE_URLS[1],
    description:
      'Friendly local pharmacy focused on daily healthcare, hygiene, and wellness.',
    isActive: true,
  },
  {
    name: 'Family Med',
    address: '8 Central Street',
    city: 'Odesa',
    phone: '+380487778899',
    email: 'family.med@example.com',
    rating: 4.7,
    imageUrl: STORE_IMAGE_URLS[2],
    description:
      'Family-oriented pharmacy with essential medicines and personal care products.',
    isActive: true,
  },
  ...Array.from({ length: 22 }, (_, index) => {
    const branchNumber = index + 1;
    const cities = ['Kyiv', 'Lviv', 'Odesa', 'Dnipro', 'Kharkiv'];
    const city = cities[index % cities.length];

    return {
      name: `E-Pharmacy Branch ${branchNumber}`,
      address: `${branchNumber + 10} Wellness Avenue`,
      city,
      phone: `+38050${String(1000000 + branchNumber).padStart(7, '0')}`,
      email: `branch.${branchNumber}@e-pharmacy.example.com`,
      rating: Number((4.1 + (index % 8) * 0.1).toFixed(1)),
      imageUrl: STORE_IMAGE_URLS[index % STORE_IMAGE_URLS.length],
      description: `E-Pharmacy branch in ${city} with everyday medicines and healthcare products.`,
      isActive: true,
    };
  }),
];

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

function getStoreByName(
  stores: SeedStoreDocument[],
  name: string
): SeedStoreDocument {
  const store = stores.find((item) => item.name === name);

  if (!store) {
    throw new Error(`Seed store "${name}" was not created`);
  }

  return store;
}

//===============================================================

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
    storeReviewsCount: 12 + (price % 9),
    price,
    totalQuantity,
    activeQuantity,
    reservedQuantity,
    inStock: activeQuantity > 0,
  };
}

function createModeratedReview(index: number) {
  return {
    userName: REVIEW_AUTHORS[index % REVIEW_AUTHORS.length],
    rating: (index % 5) + 1,
    comment: REVIEW_COMMENTS[index % REVIEW_COMMENTS.length],
    isModerated: true,
    moderatedAt: new Date(`2026-04-${String(1 + (index % 25)).padStart(2, '0')}T10:00:00.000Z`),
    createdAt: new Date(`2026-04-${String(1 + (index % 25)).padStart(2, '0')}T09:00:00.000Z`),
  };
}

function createModeratedReviews(count: number) {
  return Array.from({ length: count }, (_, index) =>
    createModeratedReview(index)
  );
}

//===============================================================

function createSeedProducts(stores: SeedStoreDocument[]) {
  const greenPharmacy = getStoreByName(stores, 'Green Pharmacy');
  const healthPlus = getStoreByName(stores, 'Health Plus');
  const familyMed = getStoreByName(stores, 'Family Med');
  const firstTwentyFiveStores = stores.slice(0, 25);

  return [
    {
      name: 'Paracetamol 500 mg',
      slug: 'paracetamol-500-mg',
      article: 'MED-PAR-500',
      description:
        'Common pain relief and fever reducer. Use only according to the instructions.',
      category: 'medicine',
      price: 79,
      imageUrl:
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=1200&auto=format&fit=crop',
      manufacturer: 'MedCare',
      dosage: '500 mg',
      packageQuantity: '20 tablets',
      storeId: greenPharmacy._id,
      storeName: greenPharmacy.name,
      offers: [
        createOffer(greenPharmacy, 79, 100, 10),
        createOffer(healthPlus, 84, 60, 5),
        createOffer(familyMed, 82, 40, 0),
      ],
      inStock: true,
      rating: 4.7,
      reviewsCount: 2,
      reviews: createModeratedReviews(2),
    },
    {
      name: 'Vitamin C 1000 mg',
      slug: 'vitamin-c-1000-mg',
      article: 'VIT-C-1000',
      description:
        'Vitamin C supplement for daily wellness support. Follow package instructions.',
      category: 'vitamins',
      price: 145,
      imageUrl:
        'https://images.unsplash.com/photo-1550572017-edd951b55104?q=80&w=1200&auto=format&fit=crop',
      manufacturer: 'VitaLife',
      dosage: '1000 mg',
      packageQuantity: '30 tablets',
      storeId: greenPharmacy._id,
      storeName: greenPharmacy.name,
      offers: [
        createOffer(greenPharmacy, 145, 42, 2),
        createOffer(familyMed, 151, 26, 0),
      ],
      inStock: true,
      rating: 4.5,
      reviewsCount: 1,
      reviews: createModeratedReviews(1),
    },
    {
      name: 'Digital Thermometer',
      slug: 'digital-thermometer',
      article: 'DEV-THERMO-01',
      description:
        'Electronic thermometer for quick body temperature measurement.',
      category: 'medical-devices',
      price: 229,
      imageUrl:
        'https://images.unsplash.com/photo-1583912267550-d44c808ac112?q=80&w=1200&auto=format&fit=crop',
      manufacturer: 'HealthTech',
      packageQuantity: '1 device',
      storeId: healthPlus._id,
      storeName: healthPlus.name,
      offers: [createOffer(healthPlus, 229, 18, 1)],
      inStock: true,
      rating: 4.4,
      reviewsCount: 1,
      reviews: createModeratedReviews(1),
    },
    {
      name: 'Ibuprofen 200 mg',
      slug: 'ibuprofen-200-mg',
      article: 'MED-IBU-200',
      description:
        'Pain relief medicine. Read instructions and consult a specialist if needed.',
      category: 'medicine',
      price: 96,
      imageUrl:
        'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=1200&auto=format&fit=crop',
      manufacturer: 'PharmaLine',
      dosage: '200 mg',
      packageQuantity: '20 tablets',
      storeId: healthPlus._id,
      storeName: healthPlus.name,
      offers: [
        createOffer(healthPlus, 96, 35, 3),
        createOffer(greenPharmacy, 101, 28, 0),
      ],
      inStock: true,
      rating: 4.6,
      reviewsCount: 0,
      reviews: [],
    },
    {
      name: 'Antiseptic Spray',
      slug: 'antiseptic-spray',
      article: 'HYG-SPRAY-100',
      description:
        'Antiseptic spray for external use. Suitable for home first-aid kits.',
      category: 'hygiene',
      price: 118,
      imageUrl:
        'https://images.unsplash.com/photo-1584634731339-252c581abfc5?q=80&w=1200&auto=format&fit=crop',
      manufacturer: 'CleanMed',
      packageQuantity: '100 ml',
      storeId: familyMed._id,
      storeName: familyMed.name,
      offers: [createOffer(familyMed, 118, 50, 7)],
      inStock: true,
      rating: 4.3,
      reviewsCount: 0,
      reviews: [],
    },
    {
      name: 'Moisturizing Hand Cream',
      slug: 'moisturizing-hand-cream',
      article: 'BEAUTY-HAND-75',
      description:
        'Daily moisturizing cream for dry hands and sensitive skin care.',
      category: 'beauty',
      price: 132,
      imageUrl:
        'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?q=80&w=1200&auto=format&fit=crop',
      manufacturer: 'SoftCare',
      packageQuantity: '75 ml',
      storeId: familyMed._id,
      storeName: familyMed.name,
      offers: [createOffer(familyMed, 132, 0, 0)],
      inStock: false,
      rating: 4.2,
      reviewsCount: 0,
      reviews: [],
    },
    {
      name: 'Cold Relief Capsules',
      slug: 'cold-relief-capsules',
      article: 'MED-COLD-SOLD',
      description:
        'Cold relief capsules. This demo product has customer reviews but is currently unavailable in all pharmacies.',
      category: 'medicine',
      price: 0,
      imageUrl:
        'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?q=80&w=1200&auto=format&fit=crop',
      manufacturer: 'CareLabs',
      dosage: '250 mg',
      packageQuantity: '12 capsules',
      offers: [],
      inStock: false,
      rating: 4.6,
      reviewsCount: 4,
      reviews: createModeratedReviews(4),
    },
    {
      name: 'Magnesium Complex 400 mg',
      slug: 'magnesium-complex-400-mg',
      article: 'VIT-MAG-400',
      description:
        'Magnesium complex supplement. This demo product has many reviews to test lazy loading in the reviews tab.',
      category: 'vitamins',
      price: 210,
      imageUrl:
        'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=1200&auto=format&fit=crop',
      manufacturer: 'VitaLife',
      dosage: '400 mg',
      packageQuantity: '60 tablets',
      storeId: greenPharmacy._id,
      storeName: greenPharmacy.name,
      offers: [
        createOffer(greenPharmacy, 210, 55, 5),
        createOffer(healthPlus, 224, 34, 4),
      ],
      inStock: true,
      rating: 4.4,
      reviewsCount: 25,
      reviews: createModeratedReviews(25),
    },
    {
      name: 'Omega 3 Fish Oil',
      slug: 'omega-3-fish-oil',
      article: 'VIT-OMEGA-25',
      description:
        'Omega 3 supplement. This demo product is available in 25 pharmacies to test lazy loading in the prices tab.',
      category: 'vitamins',
      price: 185,
      imageUrl:
        'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?q=80&w=1200&auto=format&fit=crop',
      manufacturer: 'Nordic Care',
      dosage: '1000 mg',
      packageQuantity: '90 capsules',
      storeId: firstTwentyFiveStores[0]._id,
      storeName: firstTwentyFiveStores[0].name,
      offers: firstTwentyFiveStores.map((store, index) =>
        createOffer(store, 185 + index * 3, 24 + index, index % 4)
      ),
      inStock: true,
      rating: 4.5,
      reviewsCount: 3,
      reviews: createModeratedReviews(3),
    },
  ];
}

//===============================================================

async function seedDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed script is blocked in production');
  }

  await connectDB();

  await Promise.all([Store.deleteMany({}), Product.deleteMany({})]);

  const createdStores = (await Store.insertMany(
    seedStores
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
