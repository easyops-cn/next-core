import type { DataStore } from "../data/DataStore.js";
import type { RuntimeContext } from "../interfaces.js";

type MinimalTplStateStoreContext = Pick<
  RuntimeContext,
  "formStateStoreId" | "formStateStoreMap"
>;

export function getFormStateStore(
  { formStateStoreId, formStateStoreMap }: MinimalTplStateStoreContext,
  using: string,
  extraInfo?: string
): DataStore<"FORM_STATE"> {
  if (!formStateStoreId) {
    throw new Error(
      `Using "${using}" outside of form renderer${extraInfo ?? ""}`
    );
  }
  const store = formStateStoreMap.get(formStateStoreId);
  if (!store) {
    throw new Error(
      `Form state store is not found when using "${using}"${
        extraInfo ?? ""
      }.\nThis is a bug of Brick Next, please report it.`
    );
  }
  return store;
}
