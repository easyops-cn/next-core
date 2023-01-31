import type { BrickPackage, MicroApp } from "@next-core/brick-types";
import { DataStore } from "./DataStore.js";

export interface RuntimeContext {
  // hash: string;
  // pathname: string;
  // query: URLSearchParams;
  app: MicroApp;
  // flags: unknown;
  brickPackages: BrickPackage[];
  ctxStore: DataStore;
  tplStateStore?: DataStore<"STATE">;
  formStateStore?: DataStore<"FORM_STATE">;
}
