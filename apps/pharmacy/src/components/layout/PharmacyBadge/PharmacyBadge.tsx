import css from './PharmacyBadge.module.css';

//===================================================================

type PharmacyBadgeProps = Readonly<{
  label?: string;
}>;

//===================================================================

export function PharmacyBadge({ label = 'Pharmacy' }: PharmacyBadgeProps) {
  return <span className={css.badge}>{label}</span>;
}
