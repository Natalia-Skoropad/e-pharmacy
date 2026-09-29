import { LoadingSpinner } from '../primitives/LoadingSpinner/LoadingSpinner';

import css from './Profile.module.css';

//===================================================================

export type ProfilePageLoaderProps = Readonly<{
  label?: string;
}>;

//===================================================================

export function ProfilePageLoader({
  label = 'Loading profile...',
}: ProfilePageLoaderProps) {
  return (
    <div className={css.pageLoaderCard}>
      <div className={css.pageLoaderBox} role="status">
        <LoadingSpinner label={label} />
      </div>
    </div>
  );
}
