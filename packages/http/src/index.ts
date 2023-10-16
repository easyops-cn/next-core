// istanbul ignore file
// Make v3 bricks compatible with Brick Next v2.
import * as HttpModuleV3 from "./exports.js";

export type * from "./exports.js";

interface DLL {
  (moduleId: "JxWY"): typeof HttpModuleV3;
}

let HttpModule: typeof HttpModuleV3;
let HttpModuleV2: typeof HttpModuleV3;

const { dll } = window as { dll?: DLL };
if (
  dll &&
  window.BRICK_NEXT_VERSIONS?.["brick-container"]?.startsWith("2.") &&
  (HttpModuleV2 = dll("JxWY"))
) {
  HttpModule = HttpModuleV2;
} else {
  HttpModule = HttpModuleV3;
}

const {
  fetch,
  HttpFetchError,
  HttpResponseError,
  HttpParseError,
  HttpAbortError,
  http,
  isHttpAbortError,
  createHttpInstance,
  defaultAdapter,
} = HttpModule;

export {
  fetch,
  HttpFetchError,
  HttpResponseError,
  HttpParseError,
  HttpAbortError,
  http,
  isHttpAbortError,
  createHttpInstance,
  defaultAdapter,
};
