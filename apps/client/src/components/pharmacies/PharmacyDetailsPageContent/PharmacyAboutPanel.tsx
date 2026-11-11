import { FileText } from 'lucide-react';

import { MarkdownContent } from '@e-pharmacy/ui/data-display';
import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';

import css from './PharmacyAboutPanel.module.css';

//===================================================================

export type PharmacyAboutPanelProps = Readonly<{
  pharmacy: PublicPharmacy;
  isPageHeading?: boolean;
}>;

//===================================================================

export function PharmacyAboutPanel({
  pharmacy,
  isPageHeading = false,
}: PharmacyAboutPanelProps) {
  return (
    <>
      <div className={css.header}>
        <span className={css.headerIcon}>
          <FileText size={22} aria-hidden="true" />
        </span>
        <div>
          {isPageHeading ? (
            <h1 className={css.title}>About pharmacy</h1>
          ) : (
            <h2 className={css.title}>About pharmacy</h2>
          )}
          <p className={css.subtitle}>
            Learn more about {pharmacy.name} and the services it offers.
          </p>
        </div>
      </div>

      <div className={css.description}>
        <MarkdownContent
          value={(
            pharmacy.description?.trim() ||
            'The pharmacy has not added a public description yet.'
          ).replace(/^#(?=\s+\S)/gm, '##')}
        />
      </div>
    </>
  );
}
