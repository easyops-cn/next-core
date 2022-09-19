import {
  HttpError,
  HttpParseError,
  HttpResponse,
  HttpResponseError,
} from "@next-core/brick-http";

let instance: ApiAnalysisService;

const apiAnalyzer = {
  create: function createApiAnalyses(
    props: ApiAnalysisServiceProps
  ): ApiAnalysisService {
    if (instance) {
      return instance;
    }
    instance = new ApiAnalysisService(props);
    return instance;
  },

  getInstance: function (): ApiAnalysisService {
    return instance;
  },
};

export interface ApiMetric {
  // Date
  _ver?: number;
  uid?: string;
  username?: string;
  // Date
  time?: number;
  type?: "api";
  st: number;
  et: number;
  duration: number;
  traceId: string;
  api: string;
  lt?: number;
  code: number;
  status: number;
  msg: string;
  page: string;
  pageId?: string;
  size?: number;
  route?: string;
}

export type PageMetric = Pick<
  ApiMetric,
  | "lt"
  | "page"
  | "pageId"
  | "route"
  | "_ver"
  | "st"
  | "et"
  | "username"
  | "time"
  | "size"
> & {
  apiCount: number;
  maxApiTimeCost: number;
  type: "page";
  pageTitle: string;
};
export type MixMetric = ApiMetric | PageMetric;

interface ApiAnalysisServiceProps {
  api: string;
}
class ApiAnalysisService {
  readonly api: string;
  public logs: MixMetric[] = [];
  public queue: ApiMetric[] = [];
  private initialized = false;

  constructor(props: ApiAnalysisServiceProps) {
    this.api = props.api;
    this.initialized = true;
    window.addEventListener("beforeunload", this.upload.bind(this), false);
  }
  private upload(): void {
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
      data: this.logs,
    };
    const blob = new Blob([JSON.stringify(data)], headers);

    window.navigator.sendBeacon(this.api, blob);
  }

  analyses(response: HttpResponse | HttpError) {
    /* istanbul ignore else */
    if (process.env.NODE_ENV === "production") {
      try {
        let log;
        if ((response as HttpError).error) {
          log = this.gatherErrorResponse(response as HttpError);
        } else {
          log = this.gatherResponse(response as HttpResponse);
        }

        this.queue.push(log);
        // this.logs.push(log);
      } catch (e) /* istanbul ignore next */ {
        // eslint-disable-next-line no-console
        console.error("There was a problem analyzing the API. ", e);
      }
    }
  }

  // Ref https://medium.com/teads-engineering/generating-uuids-at-scale-on-the-web-2877f529d2a2
  private genUUID(): string {
    const url = URL.createObjectURL(new Blob([]));
    let uuid = url.substring(url.lastIndexOf("/") + 1);
    URL.revokeObjectURL(url);
    // 第一次渲染加上特殊标记
    if (this.initialized) {
      uuid = "88-" + uuid;
      this.initialized = false;
    }
    return uuid;
  }

  pageTracker(): ({
    path,
    pageTitle,
    username,
  }: {
    path: string;
    pageTitle: string;
    username: string;
  }) => void {
    const startTime = Date.now();
    this.queue = [];
    return ({ path, pageTitle, username }) => {
      const endTime = Date.now();
      // page load time
      const lt = endTime - startTime;
      const extra = {
        lt,
        route: path,
        pageId: this.genUUID(),
      };

      const pageMetric: PageMetric = {
        type: "page",
        apiCount: this.queue.length,
        page: location.href,
        time: Math.round(startTime / 1000),
        _ver: startTime,
        maxApiTimeCost: this.queue.length
          ? Math.max(...this.queue.map((api) => api.duration))
          : 0,
        st: startTime,
        et: endTime,
        size: this.queue
          .map((v) => v.size)
          .filter(Number)
          .reduce((a, b) => a + b, 0),
        pageTitle,
        username,
        ...extra,
      };
      this.logs.push(pageMetric);
      const queuedApiList = this.queue.map((api) => ({ ...api, ...extra }));
      this.logs.push(...queuedApiList);
    };
  }

  private gatherResponse(response: HttpResponse): ApiMetric {
    const { config, headers, status, data = {} } = response;
    const et = Date.now();
    const duration = et - response.config.meta.st;
    const page = location.href;
    const { code = -1, message: msg = "" } = data;
    let traceId = "";
    let size = -1;
    if (headers instanceof Headers) {
      traceId = headers.get("x-b3-traceid");
      size = Number(response.headers.get("content-length")) || -1;
    }
    const { st, uid, username, time } = config.meta || {};
    return {
      st,
      _ver: st,
      uid,
      time,
      username,
      et,
      page,
      duration,
      api: config.url,
      type: "api",
      code,
      msg,
      status,
      traceId,
      size,
    };
  }

  private gatherErrorResponse(error: HttpError): ApiMetric {
    const { config, error: err } = error;
    const et = Date.now();
    const duration = et - config.meta.st;
    const code = -1 as any;
    const msg = "";
    let status = "" as any;
    let traceId = "";
    let size = -1;

    if (err instanceof HttpResponseError) {
      const response = err.response;
      status = response.status;
      if (response.headers instanceof Headers) {
        traceId = response.headers.get("x-b3-traceid");
        size = Number(response.headers.get("content-length")) || -1;
      }
    } else if (err instanceof HttpParseError) {
      const response = err.response;
      status = response?.status;
      if (response.headers instanceof Headers) {
        traceId = response.headers.get("x-b3-traceid");
        size = Number(response.headers.get("content-length")) || -1;
      }
    }
    const page = location.href;
    const { st, uid, username, time } = config.meta || {};

    return {
      st,
      _ver: st,
      uid,
      username,
      time,
      type: "api",
      et,
      page,
      duration,
      api: config.url,
      code,
      msg,
      status,
      traceId,
      size,
    };
  }
}
export { apiAnalyzer };
