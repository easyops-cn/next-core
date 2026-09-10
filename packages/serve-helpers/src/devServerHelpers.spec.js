import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadDevConfig } from "./loadDevConfig.js";
import { resolveLocalBrickFolders } from "./resolveLocalBrickFolders.js";

describe("dev server helpers", () => {
  it("resolves brick folders from a Windows-style path", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "next-core-bricks-"));
    const brickFolder = path.join(rootDir, "bricks", "example");

    try {
      await mkdir(brickFolder, { recursive: true });
      const root = path.parse(brickFolder).root;
      const windowsStylePattern = path
        .relative(root, brickFolder)
        .split(path.sep)
        .join("\\");

      const matches = await resolveLocalBrickFolders(root, [
        windowsStylePattern,
      ]);

      expect(matches.map((item) => path.normalize(item))).toEqual([
        brickFolder,
      ]);
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  });

  it("loads dev.config.mjs through a file URL", async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), "next-core-config-"));

    try {
      await writeFile(
        path.join(rootDir, "dev.config.mjs"),
        'export default { brickFolders: ["bricks"] };'
      );

      await expect(loadDevConfig(rootDir)).resolves.toEqual({
        brickFolders: ["bricks"],
      });
    } finally {
      await rm(rootDir, { recursive: true, force: true });
    }
  });
});
