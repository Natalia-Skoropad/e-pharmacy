import { getStatusPresentation } from '@e-pharmacy/config/status';

import {
  StatusBadge as StatusBadgePrimitive,
  StatusBanner as StatusBannerPrimitive,
  type StatusBannerProps as PrimitiveStatusBannerProps,
} from '@e-pharmacy/ui/statistics';

//===================================================================

type StatusBadgeProps = Readonly<{
  status: string;
  label?: string;
  className?: string;
}>;

//===================================================================

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const presentation = getStatusPresentation(status, label);

  return (
    <StatusBadgePrimitive
      label={label ?? presentation.label}
      tone={presentation.tone}
      className={className}
    />
  );
}

//===================================================================

type StatusBannerProps = Omit<PrimitiveStatusBannerProps, 'tone'> &
  Readonly<{ status: string }>;

//===================================================================

export function StatusBanner({ status, label, ...props }: StatusBannerProps) {
  const presentation = getStatusPresentation(status, label);

  return (
    <StatusBannerPrimitive
      {...props}
      label={label ?? presentation.label}
      tone={presentation.tone}
    />
  );
}
