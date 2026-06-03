export type MetadataApp = 'client' | 'vendor' | 'admin';

export type AppSeoStrategy = {
  app: MetadataApp;
  shouldIndexPublicPages: boolean;
  privateRoutesNoIndex: boolean;
};

//===================================================================

export const SEO_STRATEGIES = {
  client: {
    app: 'client',
    shouldIndexPublicPages: true,
    privateRoutesNoIndex: true,
  },
  vendor: {
    app: 'vendor',
    shouldIndexPublicPages: false,
    privateRoutesNoIndex: true,
  },
  admin: {
    app: 'admin',
    shouldIndexPublicPages: false,
    privateRoutesNoIndex: true,
  },
} as const satisfies Record<MetadataApp, AppSeoStrategy>;
