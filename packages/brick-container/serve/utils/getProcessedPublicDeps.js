export function getProcessedPublicDeps(publicDepsStr, localBrickPackages) {
  try {
    const parsedPublicDeps = JSON.parse(publicDepsStr).filter(
      (item) => !localBrickPackages.includes(item.filePath.split("/")[1])
    );

    return JSON.stringify(parsedPublicDeps);
  } catch (_err) {
    console.error(`JSON.parse() error: ${publicDepsStr}`);
  }
}
