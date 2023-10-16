import type {
  ApiMetric,
  ApiPageState,
  PageViewMetric,
  PartialPageViewMetric,
} from "./interfaces.js";

let initialized = false;
let pageState: ApiPageState | null = null;
let isFirstPageView = true;
const stashedApiMetrics: ApiMetric[] = [];

const allMetrics: (ApiMetric | PageViewMetric)[] = [];

export function initialize(api: string) {
  if (initialized) {
    return;
  }
  initialized = true;

  function upload() {
    if (allMetrics.length === 0) {
      return;
    }
    const headers = {
      type: "application/json",
    };
    const data = {
      model: "easyops.FRONTEND_STAT",
      columns: [
        "_ver",
        "st",
        "et",
        "lt",
        "size",
        "time",
        "traceId",
        "code",
        "duration",
        "page",
        "uid",
        "username",
        "api",
        "type",
        "msg",
        "status",
        "pageId",
        "route",
        "apiCount",
        "maxApiTimeCost",
        "apiSizeCost",
        "pageTitle",
      ],
      data: allMetrics,
    };
    const blob = new Blob([JSON.stringify(data)], headers);
    allMetrics.length = 0;

    window.navigator.sendBeacon(api, blob);
  }

  window.addEventListener("beforeunload", upload, false);
}

export function createPageView() {
  stashedApiMetrics.length = 0;
  pageState = null;
}

export function finishPageView(metric: PartialPageViewMetric) {
  const pageId = generateUUID();
  const { lt, route } = metric;
  pageState = { lt, route, pageId };

  allMetrics.push({
    ...metric,
    pageId,
    apiCount: stashedApiMetrics.length,
    maxApiTimeCost: Math.max(
      0,
      ...stashedApiMetrics.map((api) => api.duration)
    ),
    size: stashedApiMetrics
      .map((api) => api.size)
      .filter((size) => size > 0)
      .reduce((prev, current) => prev + current, 0),
  });

  for (const item of stashedApiMetrics) {
    allMetrics.push({
      ...item,
      ...pageState,
    });
  }
  stashedApiMetrics.length = 0;
}

export function earlyFinishPageView() {
  allMetrics.push(...stashedApiMetrics);
  stashedApiMetrics.length = 0;
}

export function pushApiMetric(metric: ApiMetric) {
  if (pageState) {
    allMetrics.push({
      ...metric,
      type: "apiRequest",
      ...pageState,
    });
  } else {
    stashedApiMetrics.push(metric);
  }
}

// Ref https://medium.com/teads-engineering/generating-uuids-at-scale-on-the-web-2877f529d2a2
function generateUUID() {
  const url = URL.createObjectURL(new Blob([]));
  let uuid = url.substring(url.lastIndexOf("/") + 1);
  URL.revokeObjectURL(url);
  // 第一次渲染加上特殊标记
  if (isFirstPageView) {
    uuid = "88-" + uuid;
    isFirstPageView = false;
  }
  return uuid;
}
