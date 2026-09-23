export type BreadcrumbItem = Readonly<{
  label: string;
  href?: string;
}>;

export type NavigationLinkItem<TIcon = unknown> = Readonly<{
  type?: 'link';
  label: string;
  href: string;
  icon?: TIcon;
  exact?: boolean;
  disabled?: boolean;
}>;

export type NavigationGroupItem<TIcon = unknown> = Readonly<{
  type: 'group';
  label: string;
  icon?: TIcon;
  disabled?: boolean;
  children: readonly NavigationLinkItem<TIcon>[];
}>;

export type NavigationItem<TIcon = unknown> =
  | NavigationLinkItem<TIcon>
  | NavigationGroupItem<TIcon>;
