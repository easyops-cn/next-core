import path from "path";
import { getEasyopsConfig } from "@next-core/repo-config";
import { loadTemplate } from "./loadTemplate";

jest.mock("@next-core/repo-config");

describe("loadTemplate", () => {
  it("should work", () => {
    (getEasyopsConfig as jest.Mock).mockReturnValue({
      usePublicScope: false,
    });
    let files = loadTemplate("cd", "/tmp/sdk", "1.2.3");
    files = files.filter(([filePath]) => {
      const fileName = path.basename(filePath);
      return !["README.md"].includes(fileName);
    });
    expect(files).toMatchSnapshot();
  });

  it("should work for public scope", () => {
    (getEasyopsConfig as jest.Mock).mockReturnValue({
      usePublicScope: true,
    });
    let files = loadTemplate("cd", "/tmp/sdk", "1.2.3");
    files = files.filter(([filePath]) => {
      const fileName = path.basename(filePath);
      return !["README.md"].includes(fileName);
    });
    expect(files).toMatchSnapshot();
  });
});
