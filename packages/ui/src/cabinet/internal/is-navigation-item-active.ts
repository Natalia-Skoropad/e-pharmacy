import type {
  NavigationGroupItem,
  NavigationItem,
  NavigationLinkItem,
} from '../../navigation/types';

//===================================================================

export function isNavigationGroup<TIcon>(
  item: NavigationItem<TIcon>
): item is NavigationGroupItem<TIcon> {
  return item.type === 'group';
}

//===================================================================

export function isNavigationLinkActive<TIcon>(
  item: NavigationLinkItem<TIcon>,
  activePath?: string
): boolean {
  if (!activePath) return false;
  if (item.exact) return activePath === item.href;

  return activePath === item.href || activePath.startsWith(`${item.href}/`);
}

//===================================================================

export function isNavigationItemActive<TIcon>(
  item: NavigationItem<TIcon>,
  activePath?: string
): boolean {
  if (isNavigationGroup(item)) {
    return item.children.some((child) =>
      isNavigationLinkActive(child, activePath)
    );
  }

  return isNavigationLinkActive(item, activePath);
}
