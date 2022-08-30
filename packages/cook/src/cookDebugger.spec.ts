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

  it("should work", () => {
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
    const a = handler.debug();

    let index = 0;
    do {
      console.log(`[${index}] variables:`, handler.getVariables());
      index ++;
      console.log(`before ${index}`);
      const { value, done } = a.next();
      console.log(`after ${index}`);
      console.log({ value, done });
      if (done) {
        console.log(`[${index}] variables:`, handler.getVariables());
        break;
      }
    } while (true);
  });
});
