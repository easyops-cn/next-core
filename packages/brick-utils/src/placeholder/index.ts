import { utils } from "@next-core/pipes";
export { pipes } from "@next-core/pipes";

export { inject, transform, transformAndInject } from "./compile";

// Keep compatibility of these exposed APIs.
export const {
  formatUnitValue: formatValue,
  convertUnitValueByPrecision: convertValueByPrecision,
} = utils;
