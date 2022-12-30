import { createRuntime } from "@next-core/runtime";
import { http, HttpError, HttpResponse } from "@next-core/brick-http";
// import { loadScript, loadSharedModule } from "@next-core/loader";
import "./styles/default.css";

http.interceptors.response.use(
  function (response: HttpResponse) {
    // eslint-disable-next-line no-console
    console.log("response ok:", response);
    return response;
  },
  function (error: HttpError) {
    // eslint-disable-next-line no-console
    console.error("response failed:", error);
    return Promise.reject(error.error);
  }
);

const runtime = createRuntime();

runtime.bootstrap().then(
  () => {
    // eslint-disable-next-line no-console
    console.log("bootstrap ok");
  },
  (error) => {
    // eslint-disable-next-line no-console
    console.error("bootstrap failed:", error);
  }
);
