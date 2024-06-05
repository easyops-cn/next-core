import type {
  CustomOptionsType,
  CustomReportOptions,
} from "skywalking-client-js/lib/src/types";

export interface Options extends CustomOptionsType, CustomReportOptions {
  enabled?: boolean;
}

let opts: Partial<Options>;
let ClientMonitor: any;
const tasks = [] as ((...args: unknown[]) => void)[];
function initialize(configs: Partial<Options>): void {
  opts = configs;

  (async () => {
    ClientMonitor = await import(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      /*webpackChunkName: "skywalking-client-js"*/ "skywalking-client-js"
    ).then((m) => m.default);

    ClientMonitor.register({
      ...configs,
    });

    for (const task of tasks) {
      task();
    }
  })();
}

function setPerformance(configs: Partial<CustomReportOptions> = {}): void {
  const task = () => {
    ClientMonitor.setPerformance({
      collector: opts.collector,
      service: opts.service,
      pagePath: `${location.pathname}${location.search}`,
      serviceVersion: opts.serviceVersion,
      useFmp: true,
      ...configs,
    });
  };

  if (ClientMonitor) {
    task();
  } else {
    tasks.push(task);
  }
}

function reportFrameErrors(
  error: Error,
  configs: Partial<CustomReportOptions> = {}
): void {
  const task = () => {
    ClientMonitor.reportFrameErrors(
      {
        collector: opts.collector,
        service: opts.service,
        pagePath: `${location.pathname}${location.search}`,
        serviceVersion: opts.serviceVersion,
        ...configs,
      },
      error
    );
  };

  if (ClientMonitor) {
    task();
  } else {
    tasks.push(task);
  }
}

export { initialize, setPerformance, reportFrameErrors };
