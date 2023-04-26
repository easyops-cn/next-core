import "@next-core/theme/global.css";
import "@next-core/theme/loading.css";
import "./preview.css";

if (window.parent === window && location.pathname.split("/").length >= 3) {
  location.assign("../");
}

import("./bootstrap.js");