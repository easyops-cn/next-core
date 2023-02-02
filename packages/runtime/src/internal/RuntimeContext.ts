import type { BrickPackage, MicroApp } from "@next-core/brick-types";
import { DataStore } from "./DataStore.js";
import { Location } from "history";

export interface RuntimeContext {
  // hash: string;
  // pathname: string;
  // query: URLSearchParams;
  app: MicroApp;
  location: Location;
  query: URLSearchParams;
  // flags: unknown;
  brickPackages: BrickPackage[];
  ctxStore: DataStore;
  event?: Event;
  data?: unknown;
  tplStateStore?: DataStore<"STATE">;
  formStateStore?: DataStore<"FORM_STATE">;
}
