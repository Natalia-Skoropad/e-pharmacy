import mongoose, { type Types } from 'mongoose';

import { connectDB } from '../db/connectDB';
import { Product } from '../models/product.model';
import { Store } from '../models/store.model';

//===============================================================

const seedStores = [
  {
    name: 'Green Pharmacy',
    address: '15 Khreshchatyk Street',
    city: 'Kyiv',
    phone: '+380441112233',
    email: 'green.pharmacy@example.com',
    rating: 4.8,
    imageUrl:
      'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?q=80&w=1200&auto=format&fit=crop',
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
    imageUrl:
      'https://images.unsplash.com/photo-1576602976047-174e57a47881?q=80&w=1200&auto=format&fit=crop',
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
    imageUrl:
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1200&auto=format&fit=crop',
    description:
      'Family-oriented pharmacy with essential medicines and personal care products.',
    isActive: true,
  },
];

//===============================================================

type SeedStoreDocument = {
  _id: Types.ObjectId;
  name: string;
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

function createSeedProducts(stores: SeedStoreDocument[]) {
  const greenPharmacy = getStoreByName(stores, 'Green Pharmacy');
  const healthPlus = getStoreByName(stores, 'Health Plus');
  const familyMed = getStoreByName(stores, 'Family Med');

  return [
    {
      name: 'Paracetamol 500 mg',
      slug: 'paracetamol-500-mg',
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
      inStock: true,
      rating: 4.7,
      reviewsCount: 2,
      reviews: [
        {
          userName: 'Natalia',
          rating: 5,
          comment: 'Good basic medicine, fast pickup from the pharmacy.',
          createdAt: new Date('2026-04-10T10:00:00.000Z'),
        },
        {
          userName: 'Olena',
          rating: 4,
          comment: 'Clear description and normal price.',
          createdAt: new Date('2026-04-12T12:30:00.000Z'),
        },
      ],
    },
    {
      name: 'Vitamin C 1000 mg',
      slug: 'vitamin-c-1000-mg',
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
      inStock: true,
      rating: 4.5,
      reviewsCount: 1,
      reviews: [
        {
          userName: 'Iryna',
          rating: 5,
          comment: 'Nice packaging and easy ordering.',
          createdAt: new Date('2026-04-14T09:15:00.000Z'),
        },
      ],
    },
    {
      name: 'Digital Thermometer',
      slug: 'digital-thermometer',
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
      inStock: true,
      rating: 4.4,
      reviewsCount: 1,
      reviews: [
        {
          userName: 'Andrii',
          rating: 4,
          comment: 'Works well and was available in stock.',
          createdAt: new Date('2026-04-16T14:45:00.000Z'),
        },
      ],
    },
    {
      name: 'Ibuprofen 200 mg',
      slug: 'ibuprofen-200-mg',
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
      inStock: true,
      rating: 4.6,
      reviewsCount: 0,
      reviews: [],
    },
    {
      name: 'Antiseptic Spray',
      slug: 'antiseptic-spray',
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
      inStock: true,
      rating: 4.3,
      reviewsCount: 0,
      reviews: [],
    },
    {
      name: 'Moisturizing Hand Cream',
      slug: 'moisturizing-hand-cream',
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
      inStock: false,
      rating: 4.2,
      reviewsCount: 0,
      reviews: [],
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
