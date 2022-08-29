import { SimpleFunction } from "@next-core/brick-types";
import { supply } from "@next-core/supply";
import { cookDebugger } from "./cookDebugger";
import { precookFunction } from "./precookFunction";

describe("cookDebugger", () => {
  const source = `
    function test() {
      const a = 1;
      return a;
    }
  `;

  it("should work", async () => {
    const { function: funcAst, attemptToVisitGlobals } = precookFunction(
      source
    );
    const globalVariables = supply(
      attemptToVisitGlobals,
    );

    const handler = cookDebugger(funcAst, source, {
      globalVariables,
    });

    // handler.setBreakpoints([]);
    handler.debug();

    console.log("variables 0:", handler.getVariables());

    console.log("before 1");
    // await (global as any).flushPromises();
    await Promise.resolve();
    console.log("after 1");

    console.log("variables 1:", handler.getVariables());

    console.log("before 2");
    // await (global as any).flushPromises();
    await Promise.resolve();
    console.log("after 2");

    console.log("variables 2:", handler.getVariables());
  });
});
