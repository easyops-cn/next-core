import fs from "fs";
import { askEditorBrickName } from "./askEditorBrickName";

const mockTree = [
  {
    path: "/tmp/bricks/test-pkg-a/dist/bricks.json",
    content: JSON.stringify({
      bricks: [
        "test-pkg-a.brick-a",
        "test-pkg-a.brick-b",
        "test-pkg-a.brick--invalid",
      ],
    }),
  },
  {
    path: "/tmp/bricks/test-pkg-b/src/index.ts",
    content: `export function a() {}`,
  },
  {
    path: "/tmp/bricks/test-pkg-b/src/y/index.tsx",
    content: `customElements.define("test-pkg-b.brick-y", y);
customElements.define("test-pkg-b.brick-z", z);`,
  },
  {
    path: "/tmp/bricks/test-pkg-b/src/x/index.ts",
    content: `customElements.define("test-pkg-b.brick-x", x);`,
  },
];

jest.mock("fs");
jest.mock("klaw-sync", () => (filePath: string) =>
  mockTree.filter(
    (item) =>
      item.path.startsWith(filePath) &&
      (item.path.endsWith(".ts") || item.path.endsWith(".tsx"))
  )
);

(fs.existsSync as jest.Mock).mockImplementation((filePath) =>
  mockTree.some((item) => item.path === filePath)
);

(fs.readFileSync as jest.Mock).mockImplementation(
  (filePath) => mockTree.find((item) => item.path === filePath).content
);

describe("askEditorBrickName", () => {
  it("should scan bricks in bricks.json", async () => {
    const { source } = askEditorBrickName({
      packageName: "test-pkg-a",
      appRoot: "/tmp",
    }) as any;

    expect(await source()).toEqual(["brick-a", "brick-b"]);
  });

  it("should scan bricks in source code", async () => {
    const { source } = askEditorBrickName({
      packageName: "test-pkg-b",
      appRoot: "/tmp",
    }) as any;

    expect(await source()).toEqual(["brick-x", "brick-y", "brick-z"]);
  });

  it("should throw if no bricks found", () => {
    expect(() => {
      askEditorBrickName({
        packageName: "test-pkg-c",
        appRoot: "/tmp",
      });
    }).toThrowError();
  });
});
