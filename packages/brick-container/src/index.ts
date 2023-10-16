// istanbul ignore file
import "@next-core/theme/global.css";
import "@next-core/theme/loading.css";
import "./styles/default.css";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.BRICK_NEXT_VERSIONS = BRICK_NEXT_VERSIONS;

if (window.MOCK_DATE) {
  try {
    // For rare scenarios only, so load it on demand.
    const { set } = await import("mockdate");
    set(window.MOCK_DATE);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Mock date failed:", error);
  }
}

import("./bootstrap.js");
