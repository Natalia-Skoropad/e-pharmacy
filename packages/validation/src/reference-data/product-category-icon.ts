/** Strict set of supported Lucide category icons; stored as kebab-case names. */
export const PRODUCT_CATEGORY_ICONS = [
  'pill',
  'heart-pulse',
  'syringe',
  'stethoscope',
  'thermometer',
  'flask-conical',
  'droplets',
  'sparkles',
  'leaf',
  'flower-2',
  'sun',
  'moon',
  'shield-plus',
  'shield-check',
  'hand-heart',
  'activity',
  'apple',
  'baby',
  'brain',
  'bone',
  'eye',
  'ear',
  'smile',
  'brush',
  'bath',
  'package',
  'boxes',
  'briefcase-medical',
  'cross',
  'ambulance',
  'microscope',
  'dna',
  'scissors',
  'watch',
  'glasses',
  'milk',
  'tablet',
  'heart',
  'hospital',
  'salad',
  'waves',
  'sprout',
  'shirt',
] as const;

//===================================================================

export type ProductCategoryIcon = (typeof PRODUCT_CATEGORY_ICONS)[number];

//===================================================================

export const DEFAULT_PRODUCT_CATEGORY_ICON: ProductCategoryIcon = 'pill';

//===================================================================

export function isProductCategoryIcon(
  value: unknown
): value is ProductCategoryIcon {
  return (
    typeof value === 'string' &&
    (PRODUCT_CATEGORY_ICONS as readonly string[]).includes(value)
  );
}
