import { get } from "lodash";

export const PipeRegistry = new Map<string, Function>();

PipeRegistry.set("string", pipeString);
PipeRegistry.set("number", pipeNumber);
PipeRegistry.set("bool", pipeBoolean);
PipeRegistry.set("boolean", pipeBoolean);
PipeRegistry.set("json", pipeJson);
PipeRegistry.set("jsonStringify", pipeJsonStringify);
PipeRegistry.set("not", pipeNot);
PipeRegistry.set("map", map);

function map(value: any[], key: string): any[] {
  return value.map(item => {
    return get(item, key);
  });
}

function pipeString(value: any): string {
  // Consider `undefined` and `null` as `""`.
  return value === undefined || value === null ? "" : String(value);
}

function pipeNumber(value: any): number {
  return Number(value);
}

function pipeBoolean(value: any): boolean {
  // Consider `"0"` as false.
  return value !== "0" && Boolean(value);
}

function pipeJson(value: any): any {
  try {
    return JSON.parse(value);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return;
  }
}

function pipeJsonStringify(value: any): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return;
  }
}

function pipeNot(value: boolean): boolean {
  return !value;
}
