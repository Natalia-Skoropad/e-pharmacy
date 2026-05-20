import { permanentRedirect } from 'next/navigation';

//===================================================================

type PharmacyLegacyDetailsPageProps = {
  params: Promise<{
    slugId: string;
  }>;
};

//===================================================================

async function PharmacyLegacyDetailsPage({
  params,
}: PharmacyLegacyDetailsPageProps) {
  const { slugId } = await params;

  permanentRedirect(`/${slugId}`);
}

export default PharmacyLegacyDetailsPage;
