import type { PublicPharmacy } from '@e-pharmacy/types/pharmacies';

import css from './PharmacyAboutPanel.module.css';

//===================================================================

export type PharmacyAboutPanelProps = Readonly<{
  pharmacy: PublicPharmacy;
}>;

//===================================================================

function getDescriptionParagraphs(description: string | undefined): string[] {
  const normalized = description?.trim();

  if (!normalized) {
    return ['The pharmacy has not added a public description yet.'];
  }

  return normalized
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

//===================================================================

export function PharmacyAboutPanel({ pharmacy }: PharmacyAboutPanelProps) {
  return (
    <div className={css.panel}>
      <div className={css.header}>
        <h2 className={css.title}>About {pharmacy.name}</h2>
      </div>

      <div className={css.description}>
        {getDescriptionParagraphs(pharmacy.description).map(
          (paragraph, index) => (
            <p key={`${pharmacy.id}-description-${index}`}>{paragraph}</p>
          )
        )}
      </div>
    </div>
  );
}
