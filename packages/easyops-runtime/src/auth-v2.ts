// istanbul ignore file
import { getV2RuntimeFromDll } from "@next-core/runtime";
import { pick } from "lodash";
import type * as auth from "./auth.js";

export function authV2Factory() {
  const v2Kit = getV2RuntimeFromDll();
  if (v2Kit) {
    return Object.freeze(
      pick(v2Kit, ["authenticate", "getAuth", "isLoggedIn", "logout"])
    ) as typeof auth;
  }
}
