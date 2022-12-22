// @ts-check
/**
 * @param {string} packageName
 * @returns string
 */
export default function getCamelPackageName(packageName) {
  return packageName
    .replace(/-[a-z]/g, (match) => match[1].toUpperCase())
    .replace(/-[0-9]/g, (match) => `_${match[1]}`);
}
