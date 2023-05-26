// istanbul ignore file
import type { BootstrapData } from "@next-core/types";
import {
  RuntimeHooksMenuHelpers,
  _internalApiGetStoryboardInBootstrapData,
  _test_only_setBootstrapData,
} from "./Runtime.js";
import { resolveData } from "./data/resolveData.js";
import { asyncComputeRealValue } from "./compute/computeRealValue.js";

export let __test_only: RuntimeHooksMenuHelpers & {
  setBootstrapData(data: BootstrapData): void;
};

if (process.env.NODE_ENV === "test") {
  __test_only = {
    setBootstrapData: _test_only_setBootstrapData,
    getStoryboardByAppId: _internalApiGetStoryboardInBootstrapData,
    resolveData,
    asyncComputeRealValue,
  };
}
