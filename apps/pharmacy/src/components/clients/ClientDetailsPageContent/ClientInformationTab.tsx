import { Mail, MapPin, Phone, UserRound } from 'lucide-react';

import { USER_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';
import { StatusBadge } from '@e-pharmacy/ui/statistics';
import { ShimmerImage } from '@e-pharmacy/ui/media';
import { formatShortDate } from '@e-pharmacy/utils/date';

import { getClientDisplayName } from '@/lib/clients/client-display-name';
import type { PharmacyClientRow } from '@/lib/clients/clients';
import { getProductImageSrc } from '@/lib/products/product-images';
import { ClientSalesChart } from './ClientSalesChart';

import css from './ClientDetailsPageContent.module.css';

//===================================================================

export function ClientInformationTab({
  client,
}: Readonly<{ client: PharmacyClientRow }>) {
  const clientImageSrc = getProductImageSrc(client.photoUrl ?? undefined);

  const formatClientDate = (value: string) =>
    formatShortDate(value) ?? 'Not specified';

  return (
    <div className={css.informationStack}>
      <div className={css.detailsGrid}>
        <section className={css.visualCard} aria-label="Client photo">
          {clientImageSrc ? (
            <span className={css.imageFrame}>
              <ShimmerImage
                src={clientImageSrc}
                alt={getClientDisplayName(client)}
                className={css.clientImage}
                sizes="(max-width: 767px) calc(100vw - 72px), (max-width: 1439px) 360px, 44vw"
                unoptimized
              />
            </span>
          ) : (
            <div className={css.imagePlaceholder} aria-hidden="true">
              <UserRound size={72} />
            </div>
          )}
        </section>

        <section className={css.detailsCard}>
          <dl className={css.detailsList}>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge {...USER_STATUS_PRESENTATION[client.status]} />
              </dd>
            </div>
            <div>
              <dt>Client ID</dt>
              <dd>{client.id}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                {client.email ? (
                  <a href={`mailto:${client.email}`}>
                    <Mail size={17} aria-hidden="true" />
                    {client.email}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                {client.phone ? (
                  <a href={`tel:${client.phone}`}>
                    <Phone size={17} aria-hidden="true" />
                    {client.phone}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>
                {client.address ? (
                  <span className={css.detailValueWithIcon}>
                    <MapPin size={17} aria-hidden="true" />
                    {client.address}
                  </span>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt>First order</dt>
              <dd>{formatClientDate(client.firstOrderAt)}</dd>
            </div>
          </dl>

          {client.status === 'blocked' && client.statusReason ? (
            <div className={css.statusReason}>
              <strong>Inactive reason</strong>
              <p>{client.statusReason}</p>
            </div>
          ) : client.status === 'active' ? (
            <div className={`${css.statusReason} ${css.statusReasonActive}`}>
              <strong>Active client</strong>
              <p>
                The client account is active and can place orders without
                additional account restrictions.
              </p>
            </div>
          ) : null}
        </section>
      </div>

      <ClientSalesChart clientId={client.id} />
    </div>
  );
}
