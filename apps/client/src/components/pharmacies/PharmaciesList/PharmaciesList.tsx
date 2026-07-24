import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';

import PharmacyCard from '@/components/pharmacies/PharmacyCard';

import css from './PharmaciesList.module.css';

//===================================================================

type PharmaciesListProps = {
  pharmacies: PublicPharmacy[];
};

//===================================================================

function PharmaciesList({ pharmacies }: PharmaciesListProps) {
  if (pharmacies.length === 0) {
    return (
      <div className={css.empty}>
        <h2 className={css.emptyTitle}>No pharmacies found</h2>
        <p className={css.emptyText}>
          Pharmacies will appear here after they are added in the backend.
        </p>
      </div>
    );
  }

  return (
    <ul className={css.list}>
      {pharmacies.map((pharmacy) => (
        <li className={css.item} key={pharmacy.id}>
          <PharmacyCard pharmacy={pharmacy} />
        </li>
      ))}
    </ul>
  );
}

export default PharmaciesList;
