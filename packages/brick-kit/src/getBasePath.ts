/**
 * Get site's base path, generally will be `/next/` or `/`.
 */
export function getBasePath(): string {
  const base = document.querySelector("base");
  const basePath = base ? base.getAttribute("href") : "/";
  return basePath;
}
