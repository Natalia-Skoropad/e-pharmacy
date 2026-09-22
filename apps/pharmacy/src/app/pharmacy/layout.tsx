import { PharmacyShell } from '@/components/layout/PharmacyShell/PharmacyShell';

//===================================================================

type ProtectedLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

//===================================================================

function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <PharmacyShell>{children}</PharmacyShell>;
}

export default ProtectedLayout;
