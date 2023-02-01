import { isObject } from "@next-core/utils/general";
import { RuntimeContext } from "../RuntimeContext.js";
import { computeRealValue } from "./computeRealValue.js";

export async function computeRealProperties(
  properties: Record<string, unknown> | undefined,
  runtimeContext: RuntimeContext
): Promise<Record<string, unknown>> {
  if (isObject(properties)) {
    return Object.fromEntries(
      (
        await Promise.all(
          Object.entries(properties).map<
            Promise<[string, unknown] | undefined>
          >(async ([propName, propValue]) => {
            // Todo: lazyForUseBrick
            // Related: https://github.com/facebook/react/issues/11347
            const realValue = await computeRealValue(propValue, runtimeContext);
            if (realValue !== undefined) {
              // For `style` and `dataset`, only object is acceptable.
              if (
                (propName !== "style" && propName !== "dataset") ||
                isObject(realValue)
              ) {
                return [propName, realValue];
              }
            }
            // Todo: track context
          })
        )
      ).filter(Boolean) as [string, unknown][]
    );
  }

  return {};
}
