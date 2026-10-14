import { Container } from '@e-pharmacy/ui/layout';
import { ProfileResourceState } from '@e-pharmacy/ui/profile';

//===================================================================

export default function PharmacyTabLoading() {
  return (
    <main>
      <Container>
        <div style={{ paddingBlock: 32 }}>
          <ProfileResourceState
            variant="loading"
            title="Loading pharmacy information"
            description="Please wait while the pharmacy information is being loaded."
          />
        </div>
      </Container>
    </main>
  );
}
