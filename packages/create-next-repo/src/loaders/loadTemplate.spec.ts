import path from "path";
import { loadTemplate } from "./loadTemplate";

describe("loadTemplate", () => {
  it("should work by default", () => {
    let files = loadTemplate("my-repo", "/tmp/next/my-repo", {
      internal: false,
    });
    files = files.filter(([filePath]) => {
      const fileName = path.basename(filePath);
      return !["package.json", "README.md", "default.md"].includes(fileName);
    });
    expect(files).toMatchSnapshot();
  });

  it("should work for internal", () => {
    let files = loadTemplate("my-repo", "/tmp/next/my-repo", {
      internal: true,
    });
    files = files.filter(([filePath]) => {
      const fileName = path.basename(filePath);
      return [".npmrc", ".yarnrc"].includes(fileName);
    });
    expect(files).toMatchSnapshot();
  });
});
