import type { PageViewInfo } from "@next-core/runtime";
import {
  createPageView,
  earlyFinishPageView,
  finishPageView,
} from "./analytics.js";
import { getAuth } from "../auth.js";

export function create() {
  const perfStartTime = Math.round(performance.now());
  const startTime = Date.now();
  createPageView();

  return function finish({ status, path, pageTitle }: PageViewInfo) {
    if (status !== "ok") {
      earlyFinishPageView();
      return;
    }

    const renderTime = Math.round(performance.now()) - perfStartTime;
    const endTime = Date.now();
    const { username } = getAuth();

    finishPageView({
      type: "page",
      page: location.href,
      _ver: startTime,
      time: Math.round(startTime / 1000),
      st: startTime,
      et: endTime,
      lt: renderTime,
      pageTitle,
      username,
      route: path,
    });

    // For bricks which would take actions with render time.
    window.dispatchEvent(
      new CustomEvent("route.render", {
        detail: {
          renderTime,
        },
      })
    );
  };
}
