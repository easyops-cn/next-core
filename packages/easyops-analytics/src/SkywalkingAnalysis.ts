import type {
  CustomOptionsType,
  CustomReportOptions,
} from "skywalking-client-js/lib/src/types";

export interface Options extends CustomOptionsType, CustomReportOptions {
  enabled?: boolean;
}

let opts: Partial<Options>;
let ClientMonitor: any;
function initialize(configs: Partial<Options>): void {
  opts = configs;

  (async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ClientMonitor = await import(
      /*webpackChunkName: "skywalking-client-js"*/ "skywalking-client-js"
    ).then((m) => m.default);
    ClientMonitor.register({
      ...configs,
    });
  })();
}

function setPerformance(configs: Partial<CustomReportOptions> = {}): void {
  ClientMonitor?.setPerformance({
    collector: opts.collector,
    service: opts.service,
    pagePath: `${location.pathname}${location.search}`,
    serviceVersion: opts.serviceVersion,
    useFmp: true,
    ...configs,
  });
}

function reportFrameErrors(
  error: Error,
  configs: Partial<CustomReportOptions> = {}
): void {
  ClientMonitor?.reportFrameErrors(
    {
      collector: opts.collector,
      service: opts.service,
      pagePath: `${location.pathname}${location.search}`,
      serviceVersion: opts.serviceVersion,
      ...configs,
    },
    error
  );
}

export { initialize, setPerformance, reportFrameErrors };
