// Shared deterministic fixtures used by the demo seeder and safe backfill.

export const PRODUCT_BLUEPRINTS = [
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

export function createProductName(
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

export const PRODUCT_REQUEST_SEED_NAMES = [
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

//===============================================================

// Demo-only attributes derived from the deterministic catalog blueprints.
// They are fixture content, not verified manufacturer/medical information.
export type DemoCharacteristics = Readonly<{
  brand: string;
  series: string;
  manufacturer: string;
  releaseForm?: string;
  activeIngredients?: string;
  activeIngredientCount?: string;
}>;

//===============================================================

export function getDemoProductCharacteristics(
  index: number
): DemoCharacteristics | null {
  if (!Number.isInteger(index) || index < 0 || index >= 126) return null;

  const [baseName, , manufacturer, dosage] =
    PRODUCT_BLUEPRINTS[index % PRODUCT_BLUEPRINTS.length];

  const releaseForm = ['Omeprazole', 'Fluoxetine'].includes(baseName)
    ? 'Capsules'
    : 'Tablets';

  return {
    brand: manufacturer,
    series: baseName,
    manufacturer,
    releaseForm,
    activeIngredients: baseName,
    activeIngredientCount: `${baseName}: ${dosage} per ${releaseForm === 'Capsules' ? 'capsule' : 'tablet'}`,
  };
}

//===============================================================

export function getDemoProductExpectedName(index: number): string | null {
  if (!Number.isInteger(index) || index < 0 || index >= 126) return null;

  const [baseName, , manufacturer, dosage, packageQuantity] =
    PRODUCT_BLUEPRINTS[index % PRODUCT_BLUEPRINTS.length];

  return createProductName(
    baseName,
    manufacturer,
    dosage,
    packageQuantity,
    Math.floor(index / PRODUCT_BLUEPRINTS.length)
  );
}

//===============================================================

// The seed request names are deliberately generic. Do not manufacture the
// active ingredient/concentration for ambiguous cosmetics or devices.
export function getDemoRequestCharacteristics(
  index: number,
  manufacturer: string
): DemoCharacteristics | null {
  const name = PRODUCT_REQUEST_SEED_NAMES[index];

  if (!name) return null;

  const form = /drops/i.test(name)
    ? 'Drops'
    : /spray/i.test(name)
      ? 'Spray'
      : /capsules/i.test(name)
        ? 'Capsules'
        : /tablets/i.test(name)
          ? 'Tablets'
          : /lozenges/i.test(name)
            ? 'Lozenges'
            : /cream/i.test(name)
              ? 'Cream'
              : /tea/i.test(name)
                ? 'Herbal tea'
                : /gel/i.test(name)
                  ? 'Gel'
                  : /powder/i.test(name)
                    ? 'Powder'
                    : /socks/i.test(name)
                      ? 'Socks'
                      : /mask/i.test(name)
                        ? 'Mask'
                        : /thermometer/i.test(name)
                          ? 'Medical device'
                          : undefined;

  return {
    brand: manufacturer,
    series: name,
    manufacturer,

    ...(form ? { releaseForm: form } : {}),

    ...(/saline/i.test(name)
      ? {
          activeIngredients: 'Sodium chloride',
          activeIngredientCount: 'Concentration not specified in demo seed',
        }
      : {}),
  };
}
