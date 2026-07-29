import type { ComponentType, ReactNode } from 'react';

//===================================================================

type ProviderComponent = ComponentType<Readonly<{ children: ReactNode }>>;

//===================================================================

export type ClientProviderStackProps = Readonly<{
  children?: ReactNode;
  ToastProvider: ProviderComponent;
  AuthProvider: ProviderComponent;
  FavoritesProvider: ProviderComponent;
  CartProvider: ProviderComponent;
}>;

//===================================================================

export function ClientProviderStack({
  children,
  ToastProvider,
  AuthProvider,
  FavoritesProvider,
  CartProvider,
}: ClientProviderStackProps) {
  return (
    <ToastProvider>
      <AuthProvider>
        <FavoritesProvider>
          <CartProvider>{children}</CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
