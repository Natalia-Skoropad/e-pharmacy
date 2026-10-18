'use client';
import { useState } from 'react';

import {
  Activity,
  Ambulance,
  Apple,
  Baby,
  Bath,
  Bone,
  Boxes,
  Brain,
  BriefcaseMedical,
  Brush,
  Cross,
  Dna,
  Droplets,
  Ear,
  Eye,
  FlaskConical,
  Flower2,
  Glasses,
  HandHeart,
  Heart,
  HeartPulse,
  Hospital,
  Leaf,
  Microscope,
  Milk,
  Moon,
  Package,
  Pill,
  Salad,
  Scissors,
  ShieldCheck,
  ShieldPlus,
  Shirt,
  Smile,
  Sparkles,
  Sprout,
  Stethoscope,
  Sun,
  Syringe,
  Tablet,
  Thermometer,
  Watch,
  Waves,
} from 'lucide-react';

import {
  PRODUCT_CATEGORY_ICONS,
  type ProductCategoryIcon,
} from '@e-pharmacy/validation/reference-data';

import css from './CategoryIconPicker.module.css';

//===================================================================

const ICONS = {
  pill: Pill,
  'heart-pulse': HeartPulse,
  syringe: Syringe,
  stethoscope: Stethoscope,
  thermometer: Thermometer,
  'flask-conical': FlaskConical,
  droplets: Droplets,
  sparkles: Sparkles,
  leaf: Leaf,
  'flower-2': Flower2,
  sun: Sun,
  moon: Moon,
  'shield-plus': ShieldPlus,
  'shield-check': ShieldCheck,
  'hand-heart': HandHeart,
  activity: Activity,
  apple: Apple,
  baby: Baby,
  brain: Brain,
  bone: Bone,
  eye: Eye,
  ear: Ear,
  smile: Smile,
  brush: Brush,
  bath: Bath,
  package: Package,
  boxes: Boxes,
  'briefcase-medical': BriefcaseMedical,
  cross: Cross,
  ambulance: Ambulance,
  microscope: Microscope,
  dna: Dna,
  scissors: Scissors,
  watch: Watch,
  glasses: Glasses,
  milk: Milk,
  tablet: Tablet,
  heart: Heart,
  hospital: Hospital,
  salad: Salad,
  waves: Waves,
  sprout: Sprout,
  shirt: Shirt,
} as const;

//===================================================================

export function CategoryIcon({
  name,
  size = 18,
}: {
  name?: string;
  size?: number;
}) {
  const Icon = ICONS[name as ProductCategoryIcon] ?? Pill;

  return <Icon size={size} aria-hidden="true" />;
}

//===================================================================

export function CategoryIconPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: ProductCategoryIcon) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  return (
    <div className={css.root}>
      <label htmlFor="category-icon-search">Category icon</label>

      <input
        id="category-icon-search"
        className={css.search}
        placeholder="Search icons"
        value={query}
        disabled={disabled}
        onChange={(event) => setQuery(event.target.value)}
      />

      <div
        className={css.grid}
        role="group"
        aria-label="Choose a Lucide category icon"
      >
        {PRODUCT_CATEGORY_ICONS.filter((name) =>
          name.replaceAll('-', ' ').includes(query.trim().toLowerCase())
        ).map((name) => (
          <button
            type="button"
            className={css.option}
            key={name}
            title={name.replaceAll('-', ' ')}
            aria-label={name.replaceAll('-', ' ')}
            aria-pressed={value === name}
            disabled={disabled}
            onClick={() => onChange(name)}
          >
            <CategoryIcon name={name} size={21} />
          </button>
        ))}
      </div>
    </div>
  );
}
