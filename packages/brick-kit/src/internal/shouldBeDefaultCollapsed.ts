export function shouldBeDefaultCollapsed(
  defaultCollapsed: boolean,
  defaultCollapsedBreakpoint: number
): boolean {
  return (
    defaultCollapsed ||
    (defaultCollapsedBreakpoint &&
      document.documentElement.clientWidth < defaultCollapsedBreakpoint)
  );
}
