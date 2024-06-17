import { supply } from "@next-core/supply";
import { cloneDeep } from "lodash";
import { cook } from "./cook.js";
import { precookFunction } from "./precookFunction.js";
import { preevaluate } from "./preevaluate.js";
import {
  positiveCases,
  negativeCases,
  selectiveNegativeCases,
} from "./__fixtures__/index.js";
import { NormalizedCase } from "./__fixtures__/interfaces.js";
import { casesOfExpressionOnly } from "./__fixtures__/expressions.js";
import {
  negativeCasesOfExpressionOnly,
  selectiveNegativeCasesOfExpressionOnly,
} from "./__fixtures__/negative/expressions.js";
import {
  DebuggerCall,
  DebuggerNode,
  DebuggerScope,
  type FunctionObject,
} from "./ExecutionContext.js";
import type { Identifier } from "@babel/types";
import type { EstreeLiteral } from "./interfaces.js";

jest.spyOn(console, "warn").mockImplementation(() => void 0);

const getExtraGlobalVariables = (): Record<string, unknown> => ({
  DATA: {
    for: "good",
    null: null,
    undefined: undefined,
    true: true,
    false: false,
    number5: 5,
    objectA: {
      onlyInA: 1,
      bothInAB: 2,
    },
    objectB: {
      onlyInB: 3,
      bothInAB: 4,
    },
    objectC: Object.defineProperties(
      {},
      {
        C1: {
          value: 11,
        },
        C2: {
          value: 12,
          enumerable: true,
        },
        C3: {
          value: 13,
          configurable: true,
        },
      }
    ),
    objectD: {
      [Symbol.for("test-symbol")]: "Hello Symbol",
    },
    symbol: Symbol.for("test-symbol"),
    q: "a&b",
    redirect: "/r/s?t=u&v=w",
    path: "x/y.zip",
    fnReturnThisFor() {
      return (this as any).for;
    },
    getIterable(returnUndefined?: boolean) {
      return {
        index: 0,
        next() {
          const done = this.index > 1;
          if (done) {
            this.index = 0;
          } else {
            this.index += 1;
          }
          const value = done ? undefined : this.index;
          return {
            value,
            done,
          };
        },
        return() {
          this.index = 0;
          return returnUndefined
            ? undefined
            : {
                value: undefined as unknown,
                done: true,
              };
        },
        [Symbol.iterator]() {
          return this;
        },
      };
    },
  },
  APP: {
    homepage: "/hello/world",
  },
});

const equivalentFunc = (
  source: string,
  attemptToVisitGlobals: Set<string>,
  expressionOnly?: boolean
): Function => {
  const globalVariables = supply(
    attemptToVisitGlobals,
    getExtraGlobalVariables()
  );
  return new Function(
    ...Object.keys(globalVariables),
    `${expressionOnly ? "" : '"use strict"; '}return (${source})`
  )(...Object.values(globalVariables));
};

const containsExperimental = (source: string): boolean => source.includes("|>");

describe("evaluate", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2020-03-25 17:37:00"));
  });
  afterAll(() => {
    jest.setSystemTime();
    jest.useRealTimers();
  });

  it.each<NormalizedCase>(positiveCases)("%s", (desc, { source, cases }) => {
    const typescript = desc.startsWith("[TypeScript]");
    const { function: funcAst, attemptToVisitGlobals } = precookFunction(
      source,
      { typescript }
    );
    const globalVariables = supply(
      attemptToVisitGlobals,
      getExtraGlobalVariables()
    );
    const func = cook(funcAst, source, { globalVariables }) as Function;
    for (const { args, result } of cases) {
      if (!typescript) {
        expect(
          equivalentFunc(source, attemptToVisitGlobals)(...cloneDeep(args))
        ).toEqual(result);
      }
      expect(func(...cloneDeep(args))).toEqual(result);
    }
  });

  it.each<[string, unknown]>(casesOfExpressionOnly)(
    "expression-only: %s",
    (source, result) => {
      const { expression: exprAst, attemptToVisitGlobals } = preevaluate(
        `<% ${source} %>`
      );
      const globalVariables = supply(
        attemptToVisitGlobals,
        getExtraGlobalVariables()
      );
      const received = cook(exprAst, source, {
        globalVariables,
      }) as Function;
      if (!/\|>/.test(source)) {
        expect(equivalentFunc(source, attemptToVisitGlobals, true)).toEqual(
          result
        );
      }
      expect(received).toEqual(result);
    }
  );

  it("should work with no global variables", () => {
    const source = "1";
    const { expression: exprAst } = preevaluate(`<% ${source} %>`);
    const received = cook(exprAst, source) as Function;
    expect(received).toEqual(1);
  });

  it.each<NormalizedCase>(negativeCases)(
    "should throw: %s",
    (desc, { source, cases }) => {
      const typescript = desc.startsWith("[TypeScript]");
      const { function: funcAst, attemptToVisitGlobals } = precookFunction(
        source,
        { typescript }
      );
      const globalVariables = supply(
        attemptToVisitGlobals,
        getExtraGlobalVariables()
      );
      const func = cook(funcAst, source, { globalVariables }) as Function;
      for (const { args } of cases) {
        if (!typescript && !containsExperimental(source)) {
          expect(() =>
            equivalentFunc(source, attemptToVisitGlobals)(...cloneDeep(args))
          ).toThrowError();
        }
        expect(() => func(...cloneDeep(args))).toThrowErrorMatchingSnapshot();
      }
    }
  );

  it.each<NormalizedCase>(selectiveNegativeCases)(
    "should throw [selective]: %s",
    (desc, { source, cases }) => {
      const typescript = desc.startsWith("[TypeScript]");
      for (const { args } of cases) {
        expect(() => {
          const { function: funcAst, attemptToVisitGlobals } = precookFunction(
            source,
            { typescript }
          );
          const globalVariables = supply(
            attemptToVisitGlobals,
            getExtraGlobalVariables()
          );
          const func = cook(funcAst, source, {
            globalVariables,
          }) as Function;
          func(...cloneDeep(args));
        }).toThrowErrorMatchingSnapshot();
      }
    }
  );

  it("should throw if restrict no war usage", () => {
    const source = `
      function test() {
        var a = 1;
        return a;
      }
    `;
    expect(() => equivalentFunc(source, new Set())).not.toThrowError();
    const { function: funcAst, attemptToVisitGlobals } =
      precookFunction(source);
    const globalVariables = supply(
      attemptToVisitGlobals,
      getExtraGlobalVariables()
    );
    expect(() => {
      const func = cook(funcAst, source, {
        globalVariables,
        rules: { noVar: true },
      }) as Function;
      func();
    }).toThrowErrorMatchingSnapshot();
  });

  it.each<string>(negativeCasesOfExpressionOnly)(
    "should throw: expression-only: %s",
    (source) => {
      const { expression: exprAst, attemptToVisitGlobals } = preevaluate(
        `<% ${source} %>`
      );
      const globalVariables = supply(
        attemptToVisitGlobals,
        getExtraGlobalVariables()
      );
      if (!containsExperimental(source)) {
        expect(() =>
          equivalentFunc(source, attemptToVisitGlobals, true)
        ).toThrowError();
      }
      expect(() =>
        cook(exprAst, source, { globalVariables })
      ).toThrowErrorMatchingSnapshot();
    }
  );

  it.each<string>(selectiveNegativeCasesOfExpressionOnly)(
    "should throw [selective]: expression-only: %s",
    (source) => {
      const { expression: exprAst, attemptToVisitGlobals } = preevaluate(
        `<% ${source} %>`
      );
      const globalVariables = supply(
        attemptToVisitGlobals,
        getExtraGlobalVariables()
      );
      expect(() =>
        cook(exprAst, source, { globalVariables })
      ).toThrowErrorMatchingSnapshot();
    }
  );

  it("should call hooks", () => {
    const source = `
      function test(a) {
        try {
          if (a) {
            return a === 1 ? true : false;
          }
          throw 'oops';
        } catch (e) {
          return null;
        }
      }
    `;
    const { function: funcAst, attemptToVisitGlobals } =
      precookFunction(source);
    const globalVariables = supply(
      attemptToVisitGlobals,
      getExtraGlobalVariables()
    );
    const beforeEvaluate = jest.fn();
    const beforeCall = jest.fn();
    const beforeBranch = jest.fn();
    const func = cook(funcAst, source, {
      globalVariables,
      hooks: {
        beforeEvaluate,
        beforeCall,
        beforeBranch,
      },
    }) as Function;

    func(1);
    expect(beforeEvaluate).toBeCalledTimes(12);
    expect(beforeEvaluate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "FunctionDeclaration",
      })
    );
    expect(beforeEvaluate).toHaveBeenNthCalledWith(
      12,
      expect.objectContaining({
        type: "Literal",
        value: true,
      })
    );
    expect(beforeEvaluate).not.toBeCalledWith(
      expect.objectContaining({
        type: "Literal",
        value: false,
      })
    );
    expect(beforeEvaluate).not.toBeCalledWith(
      expect.objectContaining({
        type: "ThrowStatement",
      })
    );
    expect(beforeCall).toBeCalledTimes(1);
    expect(beforeCall).toBeCalledWith(
      expect.objectContaining({
        type: "FunctionDeclaration",
      })
    );
    expect(beforeBranch).toBeCalledTimes(1);
    expect(beforeBranch).toBeCalledWith(
      expect.objectContaining({
        type: "IfStatement",
      }),
      "if"
    );

    jest.clearAllMocks();
    func(0);
    expect(beforeEvaluate).toBeCalledTimes(10);
    expect(beforeEvaluate).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        type: "ThrowStatement",
      })
    );
    expect(beforeEvaluate).toHaveBeenNthCalledWith(
      7,
      expect.objectContaining({
        type: "CatchClause",
      })
    );
    expect(beforeEvaluate).toHaveBeenNthCalledWith(
      10,
      expect.objectContaining({
        type: "Literal",
        value: null,
      })
    );
    expect(beforeCall).toBeCalledTimes(1);
    expect(beforeCall).toBeCalledWith(
      expect.objectContaining({
        type: "FunctionDeclaration",
      })
    );
    expect(beforeBranch).toBeCalledTimes(1);
    expect(beforeBranch).toBeCalledWith(
      expect.objectContaining({
        type: "IfStatement",
      }),
      "else"
    );
  });

  it("support RegExp", () => {
    const source = `
      function test() {
        const reg = new RegExp("b");
        return "abc".replace(reg, "");
      }
    `;
    expect(() => equivalentFunc(source, new Set())).not.toThrowError();
    const { function: funcAst, attemptToVisitGlobals } =
      precookFunction(source);
    const globalVariables = supply(
      attemptToVisitGlobals,
      getExtraGlobalVariables()
    );
    const func = cook(funcAst, source, {
      globalVariables,
      rules: { noVar: true },
    }) as Function;
    const result = func();
    expect(result).toBe("ac");
  });

  test("debug basic usage", async () => {
    const source = `function test() {
  function f() {
    let a = 1;
    return a;
  }
  return f() + 1;
}`;
    const { function: funcAst, attemptToVisitGlobals } =
      precookFunction(source);
    const globalVariables = supply(attemptToVisitGlobals);
    const func = cook(funcAst, source, {
      globalVariables,
      debug: true,
    }) as FunctionObject;
    const debuggerCall = func[DebuggerCall]!;
    const debuggerNode = func[DebuggerNode]!;
    const debuggerScope = func[DebuggerScope]!;
    const getScopedValues = () => {
      const values = [];
      let currentScope = debuggerScope() as any;
      while (currentScope) {
        values.push(
          Object.fromEntries(
            [...currentScope.bindingMap]
              .filter(([k]) => currentScope.OuterEnv || k !== "undefined")
              .map(([k, v]) => [k, v.value])
          )
        );
        currentScope = currentScope.OuterEnv;
      }
      return values;
    };
    const iterator = debuggerCall();
    let index = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = iterator.next();

      await Promise.resolve();

      const node = debuggerNode();

      switch (index) {
        case 0:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("ReturnStatement");
          expect(getScopedValues()).toEqual([
            { f: expect.any(Function) },
            { test: expect.any(Function) },
          ]);
          break;
        case 1:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("Identifier");
          expect((node as Identifier)?.name).toBe("f");
          expect(getScopedValues()).toEqual([
            { f: expect.any(Function) },
            { test: expect.any(Function) },
          ]);
          break;
        case 2:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("Literal");
          expect((node as EstreeLiteral)?.value).toBe(1);
          expect(getScopedValues()).toEqual([
            { a: undefined },
            { f: expect.any(Function) },
            { test: expect.any(Function) },
          ]);
          break;
        case 3:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("ReturnStatement");
          expect(getScopedValues()).toEqual([
            { a: 1 },
            { f: expect.any(Function) },
            { test: expect.any(Function) },
          ]);
          break;
        case 4:
          expect(done).toBe(false);
          expect(value).toEqual({ type: "return", value: 1 });
          expect(node?.type).toBe("FunctionDeclaration");
          expect(getScopedValues()).toEqual([
            { a: 1 },
            { f: expect.any(Function) },
            { test: expect.any(Function) },
          ]);
          break;
        case 5:
          expect(done).toBe(false);
          expect(value).toEqual({ type: "return", value: 2 });
          expect(node?.type).toBe("FunctionDeclaration");
          expect(getScopedValues()).toEqual([
            { f: expect.any(Function) },
            { test: expect.any(Function) },
          ]);
          break;
      }

      if (done) {
        expect(value).toBe(2);
        expect(index).toBe(6);
        break;
      }

      index++;
    }
  });

  test("debug tagged template expression", async () => {
    const source = `function test() {
  function f(a , b) {
    return [a, b];
  }
  return f\`a=\${1}\`;
}`;
    const { function: funcAst, attemptToVisitGlobals } =
      precookFunction(source);
    const globalVariables = supply(attemptToVisitGlobals);
    const func = cook(funcAst, source, {
      globalVariables,
      debug: true,
    }) as FunctionObject;
    const debuggerCall = func[DebuggerCall]!;
    const debuggerNode = func[DebuggerNode]!;
    const iterator = debuggerCall();
    let index = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = iterator.next();

      await Promise.resolve();

      const node = debuggerNode();

      switch (index) {
        case 1:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("Identifier");
          expect((node as Identifier)?.name).toBe("f");
          break;
      }

      if (done) {
        expect(value).toEqual([["a=", ""], 1]);
        break;
      }

      index++;
    }
  });

  test("debug assignment expression", async () => {
    const source = `function test(a) {
  let b;
  b = a + 1;
}`;
    const { function: funcAst, attemptToVisitGlobals } =
      precookFunction(source);
    const globalVariables = supply(attemptToVisitGlobals);
    const func = cook(funcAst, source, {
      globalVariables,
      debug: true,
    }) as FunctionObject;
    const debuggerCall = func[DebuggerCall]!;
    const debuggerNode = func[DebuggerNode]!;
    const iterator = debuggerCall(2);
    let index = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = iterator.next();

      await Promise.resolve();

      const node = debuggerNode();

      switch (index) {
        case 0:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("ExpressionStatement");
          break;
        case 1:
          expect(done).toBe(false);
          expect(value).toEqual({ type: "return", value: undefined });
          expect(node?.type).toBe("FunctionDeclaration");
          break;
      }

      if (done) {
        expect(value).toEqual(undefined);
        break;
      }

      index++;
    }
  });

  test("debug if statement", async () => {
    const source = `function test(a) {
  if (a) {
    return "A";
  }
  return "B";
}`;
    const { function: funcAst, attemptToVisitGlobals } =
      precookFunction(source);
    const globalVariables = supply(attemptToVisitGlobals);
    const func = cook(funcAst, source, {
      globalVariables,
      debug: true,
    }) as FunctionObject;
    const debuggerCall = func[DebuggerCall]!;
    const debuggerNode = func[DebuggerNode]!;
    const iterator = debuggerCall(1);
    let index = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = iterator.next();

      await Promise.resolve();

      const node = debuggerNode();

      switch (index) {
        case 0:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("IfStatement");
          break;
        case 1:
          expect(done).toBe(false);
          expect(value).toEqual(undefined);
          expect(node?.type).toBe("ReturnStatement");
          break;
        case 2:
          expect(done).toBe(false);
          expect(value).toEqual({ type: "return", value: "A" });
          expect(node?.type).toBe("FunctionDeclaration");
          break;
      }

      if (done) {
        expect(value).toEqual("A");
        break;
      }

      index++;
    }
  });

  test("debug switch statement", async () => {
    const source = `function test(a) {
  switch (a) {
    case 1:
      return "A";
  }
}`;
    const { function: funcAst, attemptToVisitGlobals } =
      precookFunction(source);
    const globalVariables = supply(attemptToVisitGlobals);
    const func = cook(funcAst, source, {
      globalVariables,
      debug: true,
    }) as FunctionObject;
    const debuggerCall = func[DebuggerCall]!;
    const debuggerNode = func[DebuggerNode]!;
    const iterator = debuggerCall(1);
    let index = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = iterator.next();

      await Promise.resolve();

      const node = debuggerNode();

      switch (index) {
        case 0:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("SwitchStatement");
          break;
        case 1:
          expect(done).toBe(false);
          expect(value).toEqual(undefined);
          expect(node?.type).toBe("ReturnStatement");
          break;
        case 2:
          expect(done).toBe(false);
          expect(value).toEqual({ type: "return", value: "A" });
          expect(node?.type).toBe("FunctionDeclaration");
          break;
      }

      if (done) {
        expect(value).toEqual("A");
        break;
      }

      index++;
    }
  });

  test("debug variable declaration with array/object pattern", async () => {
    const source = `function test(a) {
  const { b } = a;
}`;
    const { function: funcAst, attemptToVisitGlobals } =
      precookFunction(source);
    const globalVariables = supply(attemptToVisitGlobals);
    const func = cook(funcAst, source, {
      globalVariables,
      debug: true,
    }) as FunctionObject;
    const debuggerCall = func[DebuggerCall]!;
    const debuggerNode = func[DebuggerNode]!;
    const iterator = debuggerCall(1);
    let index = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = iterator.next();

      await Promise.resolve();

      const node = debuggerNode();

      switch (index) {
        case 0:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("Identifier");
          expect((node as Identifier)?.name).toBe("a");
          break;
        case 1:
          expect(done).toBe(false);
          expect(value).toEqual({ type: "return", value: undefined });
          expect(node?.type).toBe("FunctionDeclaration");
          break;
      }

      if (done) {
        expect(value).toEqual(undefined);
        break;
      }

      index++;
    }
  });

  test("debug for in statement (lexical binding)", async () => {
    const source = `function test(a) {
  const b = { c: 1 };
  for (let k in b) {
    a;
  }
}`;
    const { function: funcAst, attemptToVisitGlobals } =
      precookFunction(source);
    const globalVariables = supply(attemptToVisitGlobals);
    const func = cook(funcAst, source, {
      globalVariables,
      debug: true,
    }) as FunctionObject;
    const debuggerCall = func[DebuggerCall]!;
    const debuggerNode = func[DebuggerNode]!;
    const debuggerScope = func[DebuggerScope]!;
    const iterator = debuggerCall();
    let index = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = iterator.next();

      await Promise.resolve();

      const node = debuggerNode();

      switch (index) {
        case 1:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("Identifier");
          expect((node as Identifier)?.name).toBe("b");
          break;
        case 2:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("Identifier");
          expect((node as Identifier)?.name).toBe("k");
          expect(() =>
            debuggerScope()?.GetBindingValue("k")
          ).toThrowErrorMatchingInlineSnapshot(`"k is not initialized"`);
          break;
        case 3:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("ExpressionStatement");
          expect(debuggerScope()?.OuterEnv?.GetBindingValue("k")).toBe("c");
          break;
        case 4:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("Identifier");
          expect((node as Identifier)?.name).toBe("k");
          break;
        case 5:
          expect(done).toBe(false);
          expect(value).toEqual({ type: "return", value: undefined });
          expect(node?.type).toBe("FunctionDeclaration");
          break;
      }

      if (done) {
        expect(value).toEqual(undefined);
        break;
      }

      index++;
    }
  });

  test("debug for of statement (assignment)", async () => {
    const source = `function test(a) {
  const b = [1];
  let i;
  for (i of b) {
    a;
  }
}`;
    const { function: funcAst, attemptToVisitGlobals } =
      precookFunction(source);
    const globalVariables = supply(attemptToVisitGlobals);
    const func = cook(funcAst, source, {
      globalVariables,
      debug: true,
    }) as FunctionObject;
    const debuggerCall = func[DebuggerCall]!;
    const debuggerNode = func[DebuggerNode]!;
    const debuggerScope = func[DebuggerScope]!;
    const iterator = debuggerCall();
    let index = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = iterator.next();

      await Promise.resolve();

      const node = debuggerNode();

      switch (index) {
        case 1:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("Identifier");
          expect((node as Identifier)?.name).toBe("b");
          break;
        case 2:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("Identifier");
          expect((node as Identifier)?.name).toBe("i");
          expect(debuggerScope()?.GetBindingValue("i")).toBe(undefined);
          break;
        case 3:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("ExpressionStatement");
          expect(debuggerScope()?.OuterEnv?.GetBindingValue("i")).toBe(1);
          break;
        case 4:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("Identifier");
          expect((node as Identifier)?.name).toBe("i");
          expect(debuggerScope()?.GetBindingValue("i")).toBe(1);
          break;
        case 5:
          expect(done).toBe(false);
          expect(value).toEqual({ type: "return", value: undefined });
          expect(node?.type).toBe("FunctionDeclaration");
          break;
      }

      if (done) {
        expect(value).toEqual(undefined);
        break;
      }

      index++;
    }
  });

  test("debug for statement", async () => {
    const source = `function test(a) {
  for (let i = 0; i < 1; i++) {
    a;
  }
}`;
    const { function: funcAst, attemptToVisitGlobals } =
      precookFunction(source);
    const globalVariables = supply(attemptToVisitGlobals);
    const func = cook(funcAst, source, {
      globalVariables,
      debug: true,
    }) as FunctionObject;
    const debuggerCall = func[DebuggerCall]!;
    const debuggerNode = func[DebuggerNode]!;
    const debuggerScope = func[DebuggerScope]!;
    const iterator = debuggerCall();
    let index = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = iterator.next();

      await Promise.resolve();

      const node = debuggerNode();

      switch (index) {
        case 0:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("Literal");
          expect((node as EstreeLiteral)?.value).toBe(0);
          break;
        case 1:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("BinaryExpression");
          expect(debuggerScope()?.GetBindingValue("i")).toBe(0);
          break;
        case 3:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("UpdateExpression");
          expect(debuggerScope()?.GetBindingValue("i")).toBe(0);
          break;
        case 4:
          expect(done).toBe(false);
          expect(value).toBe(undefined);
          expect(node?.type).toBe("BinaryExpression");
          break;
        case 5:
          expect(done).toBe(false);
          expect(value).toEqual({ type: "return", value: undefined });
          expect(node?.type).toBe("FunctionDeclaration");
          break;
      }

      if (done) {
        expect(value).toEqual(undefined);
        break;
      }

      index++;
    }
  });
});
