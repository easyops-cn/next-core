import { isEvaluable, isTrackAll } from "@next-core/cook";
import { track, trackAll } from "@next-core/utils/storyboard";
import {
  PreEvaluated,
  getPreEvaluatedRaw,
  isPreEvaluated,
} from "./evaluate.js";

export function getTracks(value: unknown) {
  let contextNames: string[] | Set<string> | false = false;
  let stateNames: string[] | Set<string> | false = false;
  let formStateNames: string[] | Set<string> | false = false;
  if (typeof value === "string" ? isEvaluable(value) : isPreEvaluated(value)) {
    const raw =
      typeof value === "string"
        ? value
        : getPreEvaluatedRaw(value as PreEvaluated);
    if (isTrackAll(raw)) {
      const result = trackAll(raw);
      if (result) {
        contextNames = result.context;
        stateNames = result.state;
        formStateNames = result.formState;
      }
    } else {
      contextNames = track(raw, "track context", "CTX");
      stateNames = track(raw, "track state", "STATE");
      formStateNames = track(raw, "track formstate", "FORM_STATE");
    }
  }

  return { contextNames, stateNames, formStateNames };
}
