import {
  ClipboardList,
  FileText,
  Files,
  History,
  MessageSquareText,
  Package,
  PackageSearch,
  StickyNote,
} from 'lucide-react';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import type { ProductRequestEditorTab } from './ProductRequestEditorPanels';

import css from './ProductRequestEditorPanels.module.css';

//===================================================================

const sections = {
  details: {
    title: 'Product details',
    description: 'Review your saved product request and its moderation status.',
    icon: PackageSearch,
    loadingTitle: 'Loading product details',
    loadingDescription: 'The product request overview is being loaded.',
  },

  'product-data': {
    title: 'Product data',
    description:
      'Add the product name and details for Admin review. Only a valid name is required for saving a draft.',
    icon: Package,
    loadingTitle: 'Loading product data',
    loadingDescription: 'The saved product data is being loaded.',
  },

  characteristics: {
    title: 'Characteristics',
    description:
      'Review the main product properties supplied for this request.',
    icon: ClipboardList,
    loadingTitle: 'Loading characteristics',
    loadingDescription: 'The product characteristics are being loaded.',
  },

  'full-description': {
    title: 'About product',
    description:
      'Describe this product in detail using the same editor as About pharmacy.',
    icon: FileText,
    loadingTitle: 'Loading product description',
    loadingDescription: 'The product description is being loaded.',
  },

  'note-for-admin': {
    title: 'Note for Admin',
    description:
      'Use this optional field to explain something directly to Admin.',
    icon: StickyNote,
    loadingTitle: 'Loading note for Admin',
    loadingDescription: 'The saved note is being loaded.',
  },

  documents: {
    title: 'Documents',
    description:
      'Attach at least one supporting document before sending the request for moderation. Drafts can be saved without documents.',
    icon: Files,
    loadingTitle: 'Loading documents',
    loadingDescription: 'The supporting documents are being loaded.',
  },

  comments: {
    title: 'Comments',
    description:
      'Private working notes about this product request, visible to authorized pharmacy staff.',
    icon: MessageSquareText,
    loadingTitle: 'Loading comments',
    loadingDescription: 'Loading private pharmacy notes.',
  },

  activity: {
    title: 'Change history',
    description: 'Review the recorded changes to this product request.',
    icon: History,
    loadingTitle: 'Loading activity history',
    loadingDescription: 'The product request history is being loaded.',
  },
} satisfies Record<
  ProductRequestEditorTab,
  {
    title: string;
    description: string;
    icon: typeof Package;
    loadingTitle: string;
    loadingDescription: string;
  }
>;

//===================================================================

export function ProductRequestSectionState({
  tab,
  error,
  onRetry,
}: Readonly<{
  tab: ProductRequestEditorTab;
  error: Readonly<{ title: string; message: string }> | null;
  onRetry: () => void;
}>) {
  const section = sections[tab];
  const Icon = section.icon;

  return (
    <section
      className={css.editorPanel}
      aria-labelledby="request-resource-title"
    >
      <ProfileSectionHeader
        title={section.title}
        titleId="request-resource-title"
        description={section.description}
        icon={<Icon size={21} aria-hidden="true" />}
      />
      {error ? (
        <ProfileResourceState
          variant="error"
          title={error.title}
          description={error.message}
          retryLabel="Try again"
          sideActionOnDesktop
          onRetry={onRetry}
        />
      ) : (
        <ProfileResourceState
          variant="loading"
          title={section.loadingTitle}
          description={section.loadingDescription}
        />
      )}
    </section>
  );
}
