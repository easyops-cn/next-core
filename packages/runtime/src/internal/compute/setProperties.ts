import { RuntimeContext } from "@next-core/brick-types";
import { computeRealProperties } from "./computeRealProperties.js";
import { setRealProperties } from "./setRealProperties.js";

export async function setProperties(
  bricks: HTMLElement | HTMLElement[],
  properties: Record<string, unknown>,
  runtimeContext: RuntimeContext
): Promise<void> {
  const realProps = await computeRealProperties(properties, runtimeContext);
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
