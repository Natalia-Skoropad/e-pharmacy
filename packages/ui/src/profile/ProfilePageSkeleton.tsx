import css from './Profile.module.css';

//===================================================================

// Keep the identity card, tabs and form footprint while the profile resolves.
export function ProfilePageSkeleton({
  label = 'Loading owner profile',
}: Readonly<{ label?: string }> = {}) {
  return (
    <main className={css.tabsLayout} aria-label={label} aria-busy="true">
      <aside className={css.tabsSidebar} aria-hidden="true">
        <div className={css.profileSkeletonPhotoRow}>
          <span
            className={`${css.profileSkeletonBlock} ${css.profileSkeletonPhoto}`}
          />
          <span
            className={`${css.profileSkeletonBlock} ${css.profileSkeletonHint}`}
          />
        </div>
        <div className={css.profileSkeletonPair}>
          <span
            className={`${css.profileSkeletonBlock} ${css.profileSkeletonButton}`}
          />
          <span
            className={`${css.profileSkeletonBlock} ${css.profileSkeletonButton}`}
          />
        </div>
        <span
          className={`${css.profileSkeletonBlock} ${css.profileSkeletonName}`}
        />
        <span
          className={`${css.profileSkeletonBlock} ${css.profileSkeletonLine}`}
        />
        <span
          className={`${css.profileSkeletonBlock} ${css.profileSkeletonField}`}
        />
        <span
          className={`${css.profileSkeletonBlock} ${css.profileSkeletonField}`}
        />
      </aside>
      <div className={css.tabsContent} aria-hidden="true">
        <div className={css.profileSkeletonTabs}>
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className={`${css.profileSkeletonBlock} ${css.profileSkeletonButton}`}
            />
          ))}
        </div>
        <div className={css.tabPanel}>
          <span
            className={`${css.profileSkeletonBlock} ${css.profileSkeletonName}`}
          />
          <span
            className={`${css.profileSkeletonBlock} ${css.profileSkeletonLine}`}
          />
          <div className={css.formGrid}>
            {Array.from({ length: 2 }, (_, index) => (
              <div key={index} className={css.profileSkeletonFieldGroup}>
                <span
                  className={`${css.profileSkeletonBlock} ${css.profileSkeletonLabel}`}
                />
                <span
                  className={`${css.profileSkeletonBlock} ${css.profileSkeletonField}`}
                />
              </div>
            ))}
          </div>
          <span
            className={`${css.profileSkeletonBlock} ${css.profileSkeletonName}`}
          />
          <div className={css.formGrid}>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className={css.profileSkeletonFieldGroup}>
                <span
                  className={`${css.profileSkeletonBlock} ${css.profileSkeletonLabel}`}
                />
                <span
                  className={`${css.profileSkeletonBlock} ${css.profileSkeletonField}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
