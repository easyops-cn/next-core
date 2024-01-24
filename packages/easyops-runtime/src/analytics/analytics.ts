import type {
  ApiMetric,
  ApiPageState,
  PartialPageViewMetric,
} from "./interfaces.js";
import { createTransport, events, TransportOptions } from "./transport.js";

let initialized = false;
let transport: ReturnType<typeof createTransport>;
let pageState: ApiPageState | null = null;
let isFirstPageView = true;
const stashedApiMetrics: ApiMetric[] = [];

type Options = Partial<TransportOptions>;

export function initialize(api: string, options: Options = {}) {
  if (initialized) {
    return;
  }
  initialized = true;
  if (!transport) {
    transport = createTransport(api, options);
    transport.sendOnExit();
  }
}

export function createPageView() {
  stashedApiMetrics.length = 0;
  pageState = null;
}

export function finishPageView(metric: PartialPageViewMetric) {
  const pageId = generateUUID();
  const { lt, route } = metric;
  pageState = { lt, route, pageId };

  events.push({
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
    events.push({
      ...item,
      ...pageState,
    });
  }
  stashedApiMetrics.length = 0;

  transport.emit();
}

export function earlyFinishPageView() {
  events.push(...stashedApiMetrics);
  stashedApiMetrics.length = 0;
}

export function pushApiMetric(metric: ApiMetric) {
  if (pageState) {
    events.push({
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
