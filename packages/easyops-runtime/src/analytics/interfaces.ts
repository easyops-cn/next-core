export interface HttpAnalyticsMeta {
  st: number;
  time: number;
  perfStartTime: number;
}

export interface ApiMetric extends BaseMetric {
  type: "api" | "apiRequest";
  uid: string | undefined;
  duration: number;
  api: string;
  code: number;
  status: number | undefined;
  msg: string;
  traceId: string;
}

export interface PageViewMetric extends BaseMetric {
  type: "page";
  apiCount: number;
  maxApiTimeCost: number;
  pageTitle: string | undefined;
  lt: number;
  route: string | undefined;
  pageId: string;
}

export type PartialPageViewMetric = Omit<
  PageViewMetric,
  "apiCount" | "maxApiTimeCost" | "size" | "pageId"
>;

export type ApiPageState = Pick<PageViewMetric, "lt" | "route" | "pageId">;

export interface BaseMetric {
  type: string;
  time: number;
  st: number;
  et: number;
  _ver: number;
  username: string | undefined;
  page: string;
  size: number;
}
