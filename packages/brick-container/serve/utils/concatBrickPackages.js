export function concatBrickPackages(localPackages, remotePackages) {
  const localIds = new Set();
  for (const pkg of localPackages) {
    localIds.add(pkg.id ?? pkg.filePath.split("/", 2).join("/"));
  }
  return localPackages.concat(
    remotePackages.filter(
      (pkg) => !localIds.has(pkg.id ?? pkg.filePath.split("/", 2).join("/"))
    )
  );
}
