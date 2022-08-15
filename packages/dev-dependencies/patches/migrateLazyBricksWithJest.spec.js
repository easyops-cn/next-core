const tree = {
  "/tmp/bricks": [
    {
      name: ".tmp",
      isDirectory: () => false,
    },
    {
      name: "brick-a",
      isDirectory: () => true,
    },
    {
      name: "brick-b",
      isDirectory: () => true,
    },
    {
      name: "brick-c",
      isDirectory: () => true,
    },
  ],
};

const contents = {
  "/tmp/bricks/brick-a/src/index.spec.ts": `import i18next from "i18next";
import * as kit from "@next-core/brick-kit";

const spyOnAddResourceBundle = (i18next.addResourceBundle = jest.fn());

jest.spyOn(window.customElements, "define");

jest.spyOn(kit, "getRuntime").mockReturnValue({
  registerCustomTemplate: jest.fn(),
  registerCustomProcessor: jest.fn(),
} as any);

jest.mock("./lazy-bricks", () => void 0);

// Use \`require\` instead of \`import\` to avoid hoisting.
require("./index");

describe("index", () => {
  it("should add i18n resource bundle", () => {
    expect(spyOnAddResourceBundle).toBeCalled();
  });
});
`,
  "/tmp/bricks/brick-b/src/index.spec.ts": `import i18next from "i18next";
import * as kit from "@next-core/brick-kit";

const spyOnAddResourceBundle = (i18next.addResourceBundle = jest.fn());

jest.spyOn(window.customElements, "define");

jest.spyOn(kit, "getRuntime").mockReturnValue({
  registerCustomTemplate: jest.fn(),
  registerCustomProcessor: jest.fn(),
} as any);


// Use \`require\` instead of \`import\` to avoid hoisting.
require("./index");

describe("index", () => {
  it("should add i18n resource bundle", () => {
    expect(spyOnAddResourceBundle).toBeCalled();
  });
});
`,
};

const mockOutputFileSync = jest.fn();

jest.mock("fs-extra", () => ({
  existsSync: jest.fn((dir) => !!tree[dir] || contents[dir]),
  readdirSync: jest.fn((dir) => tree[dir] || []),
  readFileSync: jest.fn((filePath) => {
    if (contents[filePath]) {
      return contents[filePath];
    }
    return "";
  }),
  outputFileSync: (...args) => mockOutputFileSync(...args),
}));

jest.mock("path", () => ({
  resolve: (dir) => `/tmp/${dir}`,
  join: (...paths) => paths.join("/"),
}));

import migrateLazyBricksWithJest from "./migrateLazyBricksWithJest";

describe("migrateLazyBricksWithJest", () => {
  it("should work!", () => {
    migrateLazyBricksWithJest();
    expect(mockOutputFileSync).toHaveBeenCalledTimes(2);
    expect(mockOutputFileSync.mock.calls[0]).toEqual([
      "/tmp/bricks/brick-a/src/index.spec.ts",
      `import i18next from "i18next";
import * as kit from "@next-core/brick-kit";

const spyOnAddResourceBundle = (i18next.addResourceBundle = jest.fn());

jest.spyOn(window.customElements, "define");

jest.spyOn(kit, "getRuntime").mockReturnValue({
  registerCustomTemplate: jest.fn(),
  registerCustomProcessor: jest.fn(),
} as any);



// Use \`require\` instead of \`import\` to avoid hoisting.
require("./index");

describe("index", () => {
  it("should add i18n resource bundle", () => {
    expect(spyOnAddResourceBundle).toBeCalled();
  });
});
`,
    ]);
    expect(mockOutputFileSync.mock.calls[1]).toEqual([
      "/tmp/bricks/brick-b/src/index.spec.ts",
      `import i18next from "i18next";
import * as kit from "@next-core/brick-kit";

const spyOnAddResourceBundle = (i18next.addResourceBundle = jest.fn());

jest.spyOn(window.customElements, "define");

jest.spyOn(kit, "getRuntime").mockReturnValue({
  registerCustomTemplate: jest.fn(),
  registerCustomProcessor: jest.fn(),
} as any);


// Use \`require\` instead of \`import\` to avoid hoisting.
require("./index");

describe("index", () => {
  it("should add i18n resource bundle", () => {
    expect(spyOnAddResourceBundle).toBeCalled();
  });
});
`,
    ]);
  });
});
