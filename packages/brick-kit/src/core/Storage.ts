export function getItemFactory(storageType: "local" | "session"): any {
  return function (name: string) {
    const storage = storageType === "local" ? localStorage : sessionStorage;
    return JSON.parse(storage.getItem(name));
  };
}
