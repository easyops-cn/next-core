import {
  find,
  findLast,
  findIndex,
  findLastIndex,
  get,
  set,
  sortBy,
  groupBy,
  countBy,
  toPairs,
  zipObject,
  keys,
  keyBy,
  indexOf,
  isNil,
  isEqual,
  uniq,
  map,
  forEach,
  isEmpty,
  orderBy,
} from "lodash";
import yaml from "js-yaml";
import moment, { DurationInputArg2 } from "moment";
import { formatValue } from "../unit/func/valueFormatter";

export const PipeRegistry = new Map<string, Function>();

PipeRegistry.set("string", pipeString);
PipeRegistry.set("number", pipeNumber);
PipeRegistry.set("bool", pipeBoolean);
PipeRegistry.set("boolean", pipeBoolean);
PipeRegistry.set("json", pipeJson);
PipeRegistry.set("jsonStringify", pipeJsonStringify);
PipeRegistry.set("not", pipeNot);
PipeRegistry.set("map", pipeMap);
PipeRegistry.set("groupByToIndex", pipeGroupByToIndex);
PipeRegistry.set("get", pipeGet);
PipeRegistry.set("equal", pipeEqual);
PipeRegistry.set("split", pipeSplit);
PipeRegistry.set("join", pipeJoin);
PipeRegistry.set("includes", pipeIncludes);
PipeRegistry.set("datetime", pipeDatetime);
PipeRegistry.set("add", pipeAdd);
PipeRegistry.set("subtract", pipeSubtract);
PipeRegistry.set("multiply", pipeMultiply);
PipeRegistry.set("divide", pipeDivide);
PipeRegistry.set("groupBy", pipeGroupBy);
PipeRegistry.set("keyBy", pipeKeyBy);
PipeRegistry.set("yaml", pipeYaml);
PipeRegistry.set("yamlStringify", pipeYamlStringify);
PipeRegistry.set("parseTimeRange", pipeParseTimeRange);
PipeRegistry.set("countBy", pipeCountBy);
PipeRegistry.set("uniq", pipeUniq);
PipeRegistry.set("ternary", pipeTernary);
PipeRegistry.set("substr", pipeSubstr);
PipeRegistry.set("substring", pipeSubstring);
PipeRegistry.set("mapToArray", pipeMapToArray);
PipeRegistry.set("find", pipeFind);
PipeRegistry.set("findLast", pipeFindLast);
PipeRegistry.set("findIndex", pipeFindIndex);
PipeRegistry.set("findLastIndex", pipeFindLastIndex);
PipeRegistry.set("sort", pipeSort);
PipeRegistry.set("reverse", pipeReverse);
PipeRegistry.set("cmdbInstanceShowName", pipeCmdbInstanceShowName);
PipeRegistry.set("deltaTime", pipeDeltaTime);
PipeRegistry.set("nullish", pipeNullish);
PipeRegistry.set("graphTree", pipeGraphTree);
PipeRegistry.set("unitFormat", pipeUnitFormat);
PipeRegistry.set("slice", pipeSlice)



function pipeSlice(value:any, begin:number, end?:number):any {
  return value.slice(begin,end);
}
function pipeNullish(value: any, defaultValue: any): any {
  return value ?? defaultValue;
}

interface Period {
  startTime?: number | string;
  endTime?: number | string;
}

function isPeriod(time: any): time is Period {
  return typeof time === "object";
}

function getMoment(input: number | string, format: string): moment.Moment {
  return typeof input === "number" ? moment(input) : moment(input, format);
}

function pipeDeltaTime(
  time: number | string | Period,
  withSuffix = true,
  format = "YYYY-MM-DD HH:mm:ss"
): string {
  if (!time) return "";
  if (isPeriod(time) && time.startTime && time.endTime) {
    const startTime = getMoment(time.startTime, format);
    const endTime = getMoment(time.endTime, format);
    return moment.duration(endTime.diff(startTime)).humanize(withSuffix);
  }

  const other = isPeriod(time) ? time.startTime || time.endTime : time;
  const then = getMoment(other, format);
  return moment.duration(then.diff(moment())).humanize(withSuffix);
}

function pipeSort(value: any[], fields?: string | string[]): any[] {
  if (!Array.isArray(value)) return [];
  return sortBy(value, fields);
}

function pipeReverse(value: any[]): any[] {
  if (!Array.isArray(value)) return [];
  return value.slice().reverse();
}

function pipeMapToArray(
  value: any,
  keyField: string,
  valueField: string
): any[] {
  if (typeof value !== "object" || !value) return [];
  const fields = [keyField, valueField];
  const pairs = toPairs(value);
  return pairs.map((pair) => zipObject(fields, pair));
}

function pipeFind<T>(value: T[], item: any): T | undefined {
  return find(value, item);
}

function pipeFindLast<T>(value: T[], item: any): T | undefined {
  return findLast(value, item);
}

function pipeFindIndex(value: any[], item: any): number {
  return findIndex(value, item);
}

function pipeFindLastIndex(value: any[], item: any): number {
  return findLastIndex(value, item);
}

function pipeSubstr(value: string, start: number, length: number): string {
  if (typeof value !== "string") return "";
  return value.substr(start, length);
}

function pipeSubstring(value: string, start: number, end: number): string {
  if (typeof value !== "string") return "";
  return value.substring(start, end);
}

function pipeCmdbInstanceShowName(value: string[]): any {
  if (Array.isArray(value)) {
    const firstKey = value[0];
    const resKey = value.slice(1, value.length).join(",");
    const res = resKey ? `${firstKey}(${resKey})` : firstKey ?? "";
    return res;
  } else {
    return value;
  }
}

function pipeTernary(value: boolean, ...res: any[]): any {
  return value ? res[0] : res[1];
}

function pipeMap(value: any[], key: string): any[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
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
  if (isNil(value)) return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return;
  }
}

function pipeJsonStringify(value: any, indent = 2): string {
  try {
    return JSON.stringify(value, null, indent);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return;
  }
}

function pipeNot(value: boolean): boolean {
  return !value;
}

// 根据 groupField 字段给 value 分组，并且对分组过后的 keys 进行排序，把对应的 index 下标给到 targetField 并返回最终的 value。
function pipeGroupByToIndex(
  value: Record<string, any>[],
  groupField: string,
  targetField: string
): Record<string, any>[] {
  let result = value;
  if (!isNil(groupField) && !isNil(targetField)) {
    const groupByValue = groupBy(value, groupField);
    const allKeys = keys(groupByValue).sort();
    result = result.map((v) => {
      const item = { ...v };
      set(item, targetField, indexOf(allKeys, get(v, groupField)));
      return item;
    });
  }
  return result;
}

function pipeGet(value: any, field: string): any {
  return get(value, field);
}

function pipeEqual(value: any, other: any): boolean {
  return isEqual(value, other);
}

function pipeSplit(value: string, separator: string): string[] {
  if (typeof value === "string") {
    return value.split(separator);
  } else {
    return [];
  }
}

function pipeJoin(value: any[], separator: string): string {
  if (!Array.isArray(value)) return "";
  return value.join(separator);
}

function pipeIncludes(value: any, part: any): boolean {
  return value.includes(part);
}

function pipeDatetime(value: number | string, format: string): string {
  return moment(value).format(format);
}

function pipeAdd(
  value: number | string,
  operand: number | string
): number | string {
  return (value as any) + (operand as any);
}

function pipeSubtract(value: number, operand: number): number {
  return value - operand;
}

function pipeMultiply(value: number, operand: number): number {
  return value * operand;
}

function pipeDivide(value: number, operand: number): number {
  return value / operand;
}

function pipeGroupBy(value: any[], field: string): any {
  return groupBy(value, field);
}

function pipeCountBy(value: any, field: string): any {
  return countBy(value, field);
}

function pipeKeyBy(value: any[], field: string): any {
  return keyBy(value, field);
}

function pipeYaml(value: any): any {
  let result;
  try {
    result = yaml.safeLoad(value, { schema: yaml.JSON_SCHEMA, json: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
  return result;
}

function pipeYamlStringify(value: any, indent = 2): string {
  let result;
  try {
    result = yaml.safeDump(value, {
      indent,
      schema: yaml.JSON_SCHEMA,
      skipInvalid: true,
      noRefs: true,
      noCompatMode: true,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
  return result;
}

function pipeParseTimeRange(value: any): number {
  if (value === "now/d") {
    return +moment().startOf("day");
  }

  if (value === "now/y") {
    return +moment().startOf("year");
  }

  const reg = /^now-(\d+)(\w+)/;

  const matches = reg.exec(value);

  if (matches !== null) {
    const [, num, unit] = matches;
    return +moment().subtract(num, unit as DurationInputArg2);
  }
  return value ? +value : +moment();
}

function pipeUniq(value: any[]): any[] {
  return uniq(value);
}

// 图还原管道，对应接口：http://192.168.100.162/next/developers/providers/cmdb/instance-graph-api-traverse-graph
function pipeGraphTree(
  value: {
    edges: Record<string, any>[];
    topic_vertices: Record<string, any>[];
    vertices: Record<string, any>[];
  },
  query?: {
    sort: {
      key: string;
      order: 1 | -1;
    };
  }
): Record<string, any>[] {
  if (!value) {
    return [];
  }
  const sort = query?.sort;
  const groupByEdgeOut = groupBy(value.edges, "out");
  const findChildren = (node: Record<string, any>): Record<string, any> => {
    const relationEdges = groupByEdgeOut[node.instanceId];
    forEach(relationEdges, (edge) => {
      const key = edge.out_name;
      const foundInstance = find(value.vertices, ["instanceId", edge.in]);
      if (foundInstance) {
        const resultInstance = findChildren(foundInstance);
        if (node[key]) {
          node[key].push(resultInstance);
        } else {
          node[key] = [resultInstance];
        }
      }
    });
    if (sort) {
      const keyList = uniq(map(relationEdges, "out_name"));
      forEach(keyList, (key) => {
        if (!isEmpty(node[key])) {
          node[key] = orderBy(
            node[key],
            (item) => get(item, sort.key) ?? -Infinity,
            sort.order === -1 ? "desc" : "asc"
          );
        }
      });
    }
    return node;
  };
  const result =
    value.topic_vertices?.map((root) => {
      return findChildren(root);
    }) ?? [];
  return result;
}

function pipeUnitFormat(
  value: number,
  unit: string,
  precision = 2
): [string, string] {
  return formatValue(value, { unit, precision });
}
