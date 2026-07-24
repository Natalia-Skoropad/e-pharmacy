import type { NavigationItem } from '../../navigation/types';

//===================================================================

export function isNavigationItemActive(
  item: NavigationItem,
  activePath?: string
): boolean {
  if (!activePath) return false;
  if (item.exact) return activePath === item.href;

  return activePath === item.href || activePath.startsWith(`${item.href}/`);
}
