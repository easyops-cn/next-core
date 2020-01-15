import path from "path";
import { loadTemplate } from "./loadTemplate";

describe("loadTemplate", () => {
  it("should work", () => {
    let files = loadTemplate("cd", "/tmp/sdk", "1.2.3");
    files = files.filter(([filePath]) => {
      const fileName = path.basename(filePath);
      return !["README.md"].includes(fileName);
    });
    expect(files).toMatchSnapshot();
  });
});
