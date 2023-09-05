import "@next-core/theme/global.css";
import "@next-core/theme/loading.css";
import "./index.css";

if (window.parent === window) {
  location.assign("../");
}

import("./bootstrap.js");
