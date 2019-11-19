import path from "path";
import { loadTemplate } from "./loadTemplate";

describe("loadTemplate", () => {
  it("should work", () => {
    let files = loadTemplate("my-repo", "/tmp/next/my-repo");
    files = files.filter(([filePath]) => {
      const fileName = path.basename(filePath);
      return !["package.json", "README.md"].includes(fileName);
    });
    expect(files).toMatchSnapshot();
  });
});
