'use client';

import type { ReactNode } from 'react';
import { Mail, Phone } from 'lucide-react';

import { useToast } from '@e-pharmacy/ui/feedback';
import { PharmacyPhotoPlaceholder, ShimmerImage } from '@e-pharmacy/ui/media';
import { CopyButton } from '@e-pharmacy/ui/primitives';
import { formatDateTime } from '@e-pharmacy/utils/date';

import css from './OwnedPharmacyDetailPageContent.module.css';

//===================================================================

export const show = (value?: string | null) => value?.trim() || '—';

//===================================================================

export function DateValue({ value }: { value?: string }) {
  return value ? (
    <time dateTime={value}>{formatDateTime(value) ?? '—'}</time>
  ) : (
    <span>—</span>
  );
}

//===================================================================

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={css.field}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

//===================================================================

export function Photo({ url, name }: { url?: string | null; name: string }) {
  return (
    <div className={css.photo}>
      {url ? (
        <ShimmerImage
          src={url}
          alt={name}
          className={css.coverImage}
          sizes="(max-width: 767px) 90vw, 400px"
          unoptimized
        />
      ) : (
        <PharmacyPhotoPlaceholder />
      )}
    </div>
  );
}

//===================================================================

export function Contact({
  value,
  type,
}: {
  value?: string;
  type: 'email' | 'phone';
}) {
  const toast = useToast();

  if (!value) return <span>—</span>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);

      toast.success(`${type === 'email' ? 'Email' : 'Phone'} copied.`);
    } catch {
      toast.error(`Could not copy ${type}.`);
    }
  };

  return (
    <span className={css.contact}>
      {type === 'email' ? <Mail size={16} /> : <Phone size={16} />}
      <a href={`${type === 'email' ? 'mailto' : 'tel'}:${value}`}>{value}</a>

      <CopyButton
        label={`Copy pharmacy ${type}: ${value}`}
        onClick={() => void copy()}
      />
    </span>
  );
}
