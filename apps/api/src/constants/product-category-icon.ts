// Backend-local validation list: API must not import frontend workspace packages.
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
  'accessibility',
  'alarm-clock',
  'atom',
  'badge-check',
  'badge-plus',
  'bandage',
  'battery-full',
  'beaker',
  'bike',
  'book-open',
  'calendar-days',
  'candy',
  'clipboard-check',
  'cloud-sun',
  'coffee',
  'cooking-pot',
  'dumbbell',
  'feather',
  'fingerprint',
  'fish',
  'flame',
  'gift',
  'globe',
  'heart-handshake',
  'lightbulb',
  'wind',
  'magnet',
  'medal',
  'music',
  'palette',
  'paw-print',
  'recycle',
  'ribbon',
  'scan-heart',
  'test-tube',
  'footprints',
  'bell-ring',
  'shield-alert',
] as const;

//===============================================================

export type ProductCategoryIcon = (typeof PRODUCT_CATEGORY_ICONS)[number];

//===============================================================

export const DEFAULT_PRODUCT_CATEGORY_ICON: ProductCategoryIcon = 'pill';

//===============================================================

export function isProductCategoryIcon(
  value: unknown
): value is ProductCategoryIcon {
  return (
    typeof value === 'string' &&
    (PRODUCT_CATEGORY_ICONS as readonly string[]).includes(value)
  );
}
