export function getStorageItem(storageType: "local" | "session") {
  return function (name: string) {
    const storage = storageType === "local" ? localStorage : sessionStorage;
    return JSON.parse(storage.getItem(name) ?? "null");
  };
}
