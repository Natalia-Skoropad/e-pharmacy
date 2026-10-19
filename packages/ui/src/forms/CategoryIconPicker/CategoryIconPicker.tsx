'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';

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
  Accessibility,
  AlarmClock,
  Atom,
  BadgeCheck,
  BadgePlus,
  Bandage,
  BatteryFull,
  Beaker,
  Bike,
  BookOpen,
  CalendarDays,
  Candy,
  ClipboardCheck,
  CloudSun,
  Coffee,
  CookingPot,
  Dumbbell,
  Feather,
  Fingerprint,
  Fish,
  Flame,
  Gift,
  Globe,
  HeartHandshake,
  Lightbulb,
  Wind,
  Magnet,
  Medal,
  Music,
  Palette,
  PawPrint,
  Recycle,
  Ribbon,
  ScanHeart,
  TestTube,
  Footprints,
  BellRing,
  ShieldAlert,
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
  accessibility: Accessibility,
  'alarm-clock': AlarmClock,
  atom: Atom,
  'badge-check': BadgeCheck,
  'badge-plus': BadgePlus,
  bandage: Bandage,
  'battery-full': BatteryFull,
  beaker: Beaker,
  bike: Bike,
  'book-open': BookOpen,
  'calendar-days': CalendarDays,
  candy: Candy,
  'clipboard-check': ClipboardCheck,
  'cloud-sun': CloudSun,
  coffee: Coffee,
  'cooking-pot': CookingPot,
  dumbbell: Dumbbell,
  feather: Feather,
  fingerprint: Fingerprint,
  fish: Fish,
  flame: Flame,
  gift: Gift,
  globe: Globe,
  'heart-handshake': HeartHandshake,
  lightbulb: Lightbulb,
  wind: Wind,
  magnet: Magnet,
  medal: Medal,
  music: Music,
  palette: Palette,
  'paw-print': PawPrint,
  recycle: Recycle,
  ribbon: Ribbon,
  'scan-heart': ScanHeart,
  'test-tube': TestTube,
  footprints: Footprints,
  'bell-ring': BellRing,
  'shield-alert': ShieldAlert,
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
  const [tooltip, setTooltip] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);

  const showTooltip = (name: string, element: HTMLButtonElement) => {
    const rect = element.getBoundingClientRect();

    setTooltip({
      label: name.replaceAll('-', ' '),

      x: Math.max(
        75,
        Math.min(window.innerWidth - 75, rect.left + rect.width / 2)
      ),

      y: rect.top - 8,
    });
  };

  return (
    <div className={css.root}>
      <div className={css.fieldIntro}>
        <span className={css.fieldLabel}>
          Category icon <span aria-hidden="true">*</span>
        </span>

        <p>Choose an icon that represents this product category.</p>
      </div>

      <div
        className={css.grid}
        role="group"
        aria-label="Choose a Lucide category icon"
        onScroll={() => setTooltip(null)}
      >
        {PRODUCT_CATEGORY_ICONS.map((name) => (
          <button
            type="button"
            className={css.option}
            key={name}
            aria-label={name.replaceAll('-', ' ')}
            aria-pressed={value === name}
            disabled={disabled}
            onClick={() => onChange(name)}
            onMouseEnter={(event) => showTooltip(name, event.currentTarget)}
            onMouseLeave={() => setTooltip(null)}
            onFocus={(event) => showTooltip(name, event.currentTarget)}
            onBlur={() => setTooltip(null)}
          >
            <CategoryIcon name={name} size={21} />
          </button>
        ))}
      </div>
      {tooltip && typeof document !== 'undefined'
        ? createPortal(
            <span
              className={css.tooltip}
              role="tooltip"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              {tooltip.label}
            </span>,
            document.body
          )
        : null}
    </div>
  );
}
