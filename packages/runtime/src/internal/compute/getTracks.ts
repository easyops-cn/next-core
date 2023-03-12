import { isEvaluable } from "@next-core/cook";
import { track } from "@next-core/utils/storyboard";
import {
  PreEvaluated,
  getPreEvaluatedRaw,
  isPreEvaluated,
} from "./evaluate.js";

export function getTracks(value: unknown) {
  let contextNames: Iterable<string> | false = false;
  let stateNames: Iterable<string> | false = false;
  let formStateNames: Iterable<string> | false = false;
  if (typeof value === "string" ? isEvaluable(value) : isPreEvaluated(value)) {
    const raw =
      typeof value === "string"
        ? value
        : getPreEvaluatedRaw(value as PreEvaluated);
    contextNames = track(raw, "track context", "CTX");
    stateNames = track(raw, "track state", "STATE");
    formStateNames = track(raw, "track formstate", "FORM_STATE");
  }

  return { contextNames, stateNames, formStateNames };
}
