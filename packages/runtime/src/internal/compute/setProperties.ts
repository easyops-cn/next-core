import { RuntimeContext } from "@next-core/brick-types";
import { asyncComputeRealProperties } from "./computeRealProperties.js";
import { setRealProperties } from "./setRealProperties.js";

export async function asyncSetProperties(
  bricks: HTMLElement | HTMLElement[],
  properties: Record<string, unknown>,
  runtimeContext: RuntimeContext
): Promise<void> {
  const realProps = await asyncComputeRealProperties(
    properties,
    runtimeContext
  );
  // if (context.tplContextId) {
  //   setupUseBrickInTemplate(realProps, {
  //     templateContextId: context.tplContextId,
  //   });
  // }
  if (!Array.isArray(bricks)) {
    bricks = [bricks];
  }
  bricks.forEach((brick) => {
    setRealProperties(brick, realProps);
  });
}
