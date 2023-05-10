import { isEvaluable } from "@next-core/cook";
import {
  trackContext,
  trackState,
  trackFormState,
  isTrackAll,
  trackAllContext,
} from "@next-core/brick-utils";
import { PreEvaluated, getPreEvaluatedRaw, isPreEvaluated } from "./evaluate";

export function getTracks(value: unknown) {
  let contextNames: string[] | false = false;
  let stateNames: string[] | false = false;
  let formStateNames: string[] | false = false;
  if (typeof value === "string" ? isEvaluable(value) : isPreEvaluated(value)) {
    const raw =
      typeof value === "string"
        ? value
        : getPreEvaluatedRaw(value as PreEvaluated);
    if (isTrackAll(raw)) {
      const result = trackAllContext(raw);
      if (result) {
        contextNames = result.context;
        stateNames = result.state;
        formStateNames = result.formState;
      }
    } else {
      contextNames = trackContext(raw);
      stateNames = trackState(raw);
      formStateNames = trackFormState(raw);
    }
  }

  return { contextNames, stateNames, formStateNames };
}
