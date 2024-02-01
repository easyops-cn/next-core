import { ApiMetric, PageViewMetric } from "./interfaces.js";

export const events: (ApiMetric | PageViewMetric)[] = [];

const MAXIMUM_WAITING_TIME = 5 * 1000;
const MAXIMUM_LOGGED_EVENTS = 10;
let timer: any = null;

export const transportOptions = {
  maxWaitingTime: MAXIMUM_WAITING_TIME,
  maxLoggedEvents: MAXIMUM_LOGGED_EVENTS,
} as TransportOptions;

type TransportData = {
  model: string;
  columns: string[];
  data: (ApiMetric | PageViewMetric)[];
};

export interface TransportOptions {
  api: string;
  maxWaitingTime: number;
  maxLoggedEvents: number;
}

export function createTransport(
  api: string,
  options: Partial<TransportOptions>
) {
  Object.assign(transportOptions, { ...options, api });
  return {
    sendOnExit,
    emit,
  };
}

function nextTime(callback: (data: unknown) => void): unknown {
  return (
    window.requestIdleCallback ||
    window.requestAnimationFrame ||
    ((cb: (data: Record<string, any>) => void) => setTimeout(cb, 17))
  )(callback);
}

function emit() {
  clearTimeout(timer);
  events.length > transportOptions.maxLoggedEvents
    ? send()
    : (timer = setTimeout(send, transportOptions.maxWaitingTime));
}

function send() {
  if (events.length === 0) {
    return;
  }
  const transportEvents = events.splice(0, transportOptions.maxLoggedEvents);
  const transportData = buildTransportData(transportEvents);

  sendBeacon(transportOptions.api, transportData);

  events.length && nextTime(send);
}

function sendBeacon(requestUrl: string, data: TransportData) {
  const headers = {
    type: "application/json",
  };

  const blob = new Blob([JSON.stringify(data)], headers);
  window.navigator.sendBeacon(requestUrl, blob);
}

function sendOnExit() {
  window.addEventListener("beforeunload", send, false);
}

function buildTransportData(data: (ApiMetric | PageViewMetric)[]) {
  return {
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
    data,
  };
}
