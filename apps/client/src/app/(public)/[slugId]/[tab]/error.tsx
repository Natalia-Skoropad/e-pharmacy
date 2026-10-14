'use client';

import { Container } from '@e-pharmacy/ui/layout';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';

//===================================================================

export default function PharmacyTabError({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <main>
      <Container>
        <div style={{ paddingBlock: 32 }}>
          <ProfileResourceState
            variant="error"
            title="Pharmacy information could not be loaded"
            description="The information is temporarily unavailable. Please try again."
            retryLabel="Try again"
            onRetry={reset}
          />
        </div>
      </Container>
    </main>
  );
}
