import {
  HttpError,
  HttpParseError,
  HttpResponse,
  HttpResponseError,
} from "@easyops/brick-http";

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

export interface ApiAnalyse {
  _ver?: Date;
  uid?: string;
  username?: string;
  time?: Date;
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
}

interface ApiAnalysisServiceProps {
  api: string;
}
class ApiAnalysisService {
  readonly api: string;
  public logs: ApiAnalyse[] = [];
  public apiQueue: ApiAnalyse[] = [];

  constructor(props: ApiAnalysisServiceProps) {
    this.api = props.api;

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

        this.apiQueue.push(log);
        // this.logs.push(log);
      } catch (e) /* istanbul ignore next */ {
        // eslint-disable-next-line no-console
        console.error("There was a problem analyzing the API. ", e);
      }
    }
  }

  private pageIdFactory(): () => string {
    let carry = 0;
    const st = Date.now();
    return function () {
      const prefix = "page";
      const t = Date.now() - st;
      const r = Math.floor(Math.random() * 1000);
      const str = "-" + carry + "-" + t + "-" + r;
      carry += 1;
      return prefix + str;
    };
  }

  pageTracker(): () => void {
    const getPageId = this.pageIdFactory();
    const startTime = Date.now();
    this.apiQueue = [];
    return () => {
      const endTime = Date.now();
      // page load time
      const lt = endTime - startTime;
      const extra = {
        lt,
        pageId: getPageId(),
      };

      const queuedApiList = this.apiQueue.map((api) => ({ ...api, ...extra }));
      this.logs.push(...queuedApiList);
    };
  }

  private gatherResponse(response: HttpResponse): ApiAnalyse {
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

  private gatherErrorResponse(error: HttpError): ApiAnalyse {
    const { config, error: err } = error;
    const et = Date.now();
    const duration = et - config.meta.st;
    const code = "" as any;
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
