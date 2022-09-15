import fs from "fs";

const tree = {
  "/tmp/libs": [
    {
      name: ".tmp",
      isDirectory: () => false,
    },
    {
      name: "flow-chart",
      isDirectory: () => true,
    },
    {
      name: "lib-a",
      isDirectory: () => true,
    },
  ],
  "/tmp/libs/lib-a/src": [
    {
      name: "index.ts",
      isDirectory: () => false,
      isFile: () => true,
    },
    {
      name: "components",
      isDirectory: () => true,
    },
  ],
  "/tmp/libs/lib-a/src/components": [
    {
      name: "AnyComponent.tsx",
      isDirectory: () => false,
      isFile: () => true,
    },
    {
      name: "AnyComponent.spec.tsx",
      isDirectory: () => false,
      isFile: () => true,
    },
  ],
};

const contents = {
  "/tmp/libs/flow-chart/package.json": `{
  "name": "@libs/flow-chart",
  "scripts": {}
}`,
  "/tmp/libs/lib-a/package.json": `{
  "name": "@next-libs/lib-a",
  "main": "dist/index.bundle.js",
  "module": "dist/index.bundle.js",
  "scripts": {
    "clean": "rimraf dist",
    "start": "concurrently -k -n tsc,build \\"npm run start:types\\" \\"npm run start:rollup\\"",
    "start:rollup": "rollup --watch --config rollup.config.js",
    "start:types": "tsc --watch --emitDeclarationOnly --declaration --declarationDir dist/types",
    "build": "npm run build:types && npm run build:rollup",
    "build:rollup": "rollup --config rollup.config.js",
    "build:types": "tsc --emitDeclarationOnly --declaration --declarationDir dist/types",
    "test": "cross-env NODE_ENV='test' jest"
  }
}`,
  "/tmp/libs/lib-a/src/index.ts": `import "./components";`,
  "/tmp/libs/lib-a/src/components/AnyComponent.tsx": `import "./style.module.css";
import FirstSvg from "./images/first.svg";
import SecondSvg from "./images/second.svg";
import processors from "./processors";`,
};

const mockExistsSync = jest.fn((dir) => !!tree[dir]);
const mockReaddirSync = jest.fn((dir) => tree[dir] || []);
const mockReadFileSync = jest.fn((filePath) => {
  if (contents[filePath]) {
    return contents[filePath];
  }
  // The path of template file is a real path.
  if (filePath.endsWith("/scripts/post-build.js")) {
    return fs.readFileSync(filePath, "utf8");
  }
  throw new Error(`File not found: ${filePath}`);
});
const mockOutputFileSync = jest.fn();
const mockRemoveSync = jest.fn();

jest.mock("fs-extra", () => ({
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
  readFileSync: mockReadFileSync,
  outputFileSync: mockOutputFileSync,
  removeSync: mockRemoveSync,
}));

jest.mock("path", () => ({
  resolve: (dir) => `/tmp/${dir}`,
  join: (...paths) => paths.join("/"),
}));

jest.mock("prettier", () => ({
  format: (string) => JSON.stringify(JSON.parse(string), null, 2),
}));

const updateBuildNextLibs = require("./updateBuildNextLibs");

describe("updateBuildNextLibs", () => {
  it("should work", () => {
    updateBuildNextLibs();
    expect(mockOutputFileSync).toHaveBeenCalledTimes(2);
    expect(mockRemoveSync).toHaveBeenCalledTimes(1);
    expect(mockRemoveSync).toBeCalledWith("/tmp/libs/lib-a/rollup.config.js");

    expect(mockOutputFileSync).toHaveBeenNthCalledWith(
      1,
      "/tmp/libs/lib-a/package.json",
      `{
  "name": "@next-libs/lib-a",
  "main": "dist/cjs/index.js",
  "module": "dist/esm/index.js",
  "scripts": {
    "clean": "rimraf dist",
    "start": "concurrently -k -n types,main \\"npm run start:types\\" \\"npm run start:main\\"",
    "start:main": "cross-env NODE_ENV=development build-next-libs --watch",
    "start:types": "tsc --watch --emitDeclarationOnly --declaration --declarationDir dist/types",
    "build": "npm run build:types && npm run build:main",
    "build:main": "cross-env NODE_ENV=production build-next-libs",
    "build:types": "tsc --emitDeclarationOnly --declaration --declarationDir dist/types",
    "test": "cross-env NODE_ENV='test' jest"
  }
}`
    );

    expect(mockOutputFileSync).toHaveBeenNthCalledWith(
      2,
      "/tmp/libs/lib-a/src/components/AnyComponent.tsx",
      `import "./style.module.css";
import { ReactComponent as FirstSvg } from "./images/first.svg";
import { ReactComponent as SecondSvg } from "./images/second.svg";
import processors from "./processors";`
    );
  });
});
