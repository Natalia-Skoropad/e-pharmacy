export function shouldCloseMobileMenuForPathnameChange(
  previousPathname: string,
  nextPathname: string
): boolean {
  return previousPathname !== nextPathname;
}
