export type NavigationItem<TIcon = unknown> = Readonly<{
  label: string;
  href: string;
  icon?: TIcon;
  disabled?: boolean;
  exact?: boolean;
}>;
