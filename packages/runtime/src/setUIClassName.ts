export function setUIClassName(version = "8") {
  let lastVersion = "";
  document.body.classList.forEach((item) => {
    if (item.startsWith("ui")) {
      lastVersion = item;
    }
  });

  if (lastVersion) {
    document.body.classList.remove(lastVersion);
  }

  const getUIClassName = (version: string): string => {
    return `ui-v${version.split(".").join("-")}`;
  };

  document.body.classList.add(getUIClassName(version));
}
