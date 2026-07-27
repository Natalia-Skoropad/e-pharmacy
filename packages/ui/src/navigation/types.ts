export type BreadcrumbItem = Readonly<{
  label: string;
  href?: string;
}>;

export type NavigationItem<TIcon = unknown> = Readonly<{
  label: string;
  href: string;
  icon?: TIcon;
  exact?: boolean;
  disabled?: boolean;
}>;
