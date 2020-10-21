import {
  HttpError,
  HttpParseError,
  HttpResponse,
  HttpResponseError,
} from "@easyops/brick-http";
import { getAuth, getRuntime } from "@easyops/brick-kit";

const apiAnalyzer = {
  create: function createApiAnalyses(): ApiAnalysisService {
    return new ApiAnalysisService();
  },
};

export interface ApiAnalyse {
  uid?: string;
  org?: number;
  type?: "api";
  st: number;
  et: number;
  duration: number;
  traceId: string;
  api: string;
  code: number;
  status: number;
  msg: string;
  page: string;
}

class ApiAnalysisService {
  public logs: ApiAnalyse[] = [];
  readonly api = `${getRuntime().getBasePath()}api/gateway/data_exchange.store.ClickHouseInsertData/api/v1/data_exchange/insert`;
  constructor() {
    window.addEventListener("beforeunload", this.upload.bind(this), false);
  }

  private upload(): void {
    const headers = {
      type: "application/json",
    };
    const data = {
      model: "easyops.FRONTEND_STAT",
      columns: [
        "st",
        "et",
        "traceId",
        "code",
        "duration",
        "page",
        "uid",
        "api",
        "type",
        "msg",
        "status",
      ],
      data: this.logs,
    };
    const blob = new Blob([JSON.stringify(data)], headers);

    window.navigator.sendBeacon(this.api, blob);
  }

  analyses(response: HttpResponse | HttpError) {
    /* istanbul ignore else */
    if (
      getRuntime().getFeatureFlags()["enable-analyzer"] &&
      process.env.NODE_ENV === "production"
    ) {
      try {
        let log;
        if ((response as HttpError).error) {
          log = this.gatherErrorResponse(response as HttpError);
        } else {
          log = this.gatherResponse(response as HttpResponse);
        }

        this.logs.push(log);
      } catch (e) /* istanbul ignore next */ {
        // eslint-disable-next-line no-console
        console.error("There was a problem analyzing the API. ", e);
      }
    }
  }

  private gatherResponse(response: HttpResponse): ApiAnalyse {
    const { config, headers, status, data = {} } = response;
    const et = Date.now();
    const duration = et - response.config.meta.st;
    const page = location.href;
    const { code = -1, message: msg = "" } = data;
    const { userInstanceId: uid } = getAuth();
    let traceId = "";
    if (headers instanceof Headers) {
      traceId = headers.get("x-b3-traceid");
    }

    return {
      st: response.config.meta.st,
      et,
      page,
      duration,
      api: config.url,
      uid,
      type: "api",
      code,
      msg,
      status,
      traceId,
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
    const { userInstanceId: uid } = getAuth();
    if (err instanceof HttpResponseError) {
      const response = err.response;
      status = response.status;
      if (response.headers instanceof Headers) {
        traceId = response.headers.get("x-b3-traceid");
      }
    } else if (err instanceof HttpParseError) {
      const response = err.response;
      status = response?.status;
      if (response.headers instanceof Headers) {
        traceId = response.headers.get("x-b3-traceid");
      }
    }
    const page = location.href;

    return {
      st: config.meta.st,
      type: "api",
      et,
      page,
      duration,
      api: config.url,
      uid,
      code,
      msg,
      status,
      traceId,
    };
  }
}
export { apiAnalyzer };
