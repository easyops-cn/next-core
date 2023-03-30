if (window.parent === window && location.pathname.split("/").length >= 3) {
  location.assign("../");
}
import("./bootstrap.js");
