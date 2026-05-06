import StoreCard from '@/components/stores/StoreCard';

import type { Store } from '@/types';

import css from './StoresList.module.css';

//===================================================================

type StoresListProps = {
  stores: Store[];
};

//===================================================================

function StoresList({ stores }: StoresListProps) {
  if (stores.length === 0) {
    return (
      <div className={css.empty}>
        <h2 className={css.emptyTitle}>No pharmacy stores found</h2>
        <p className={css.emptyText}>
          Stores will appear here after they are added in the backend.
        </p>
      </div>
    );
  }

  return (
    <ul className={css.list}>
      {stores.map((store) => (
        <li className={css.item} key={store.id}>
          <StoreCard store={store} />
        </li>
      ))}
    </ul>
  );
}

export default StoresList;
