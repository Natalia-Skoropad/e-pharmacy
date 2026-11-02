import { buildPublicEntitySlugId } from '@e-pharmacy/validation/url';
import { getClientAppDestination } from '@/lib/auth/app-destinations';

//===================================================================

/** External client link, only for publicly visible pharmacy statuses. */
export function getAdminPublicPharmacyUrl(
  pharmacy: Readonly<{ id: string; name: string; status: string }>
): string | null {
  if (pharmacy.status !== 'active' && pharmacy.status !== 'on_moderation')
    return null;

  const destination = getClientAppDestination();

  if (!destination.ok) return null;

  const slug = buildPublicEntitySlugId('pharmacy', pharmacy.name, pharmacy.id);

  return new URL(
    `${destination.config.basePath}/${slug}`,
    destination.config.origin
  ).toString();
}
