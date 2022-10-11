import path from "path";
import { getEasyopsConfig } from "@next-core/repo-config";
import { loadTemplate } from "./loadTemplate";
import { FileWithContent, TargetType } from "../interface";

jest.mock("@next-core/repo-config");
(getEasyopsConfig as jest.Mock).mockReturnValue({
  useLocalSdk: true,
});

jest.mock("request-promise-native");

function ignoreVersionRelatedFiles(
  files: FileWithContent[]
): FileWithContent[] {
  return files.filter(([filePath]) => {
    const fileName = path.basename(filePath);
    return !["package.json", "README.md", "package.conf.yaml"].includes(
      fileName
    );
  });
}

describe("loadTemplate", () => {
  it("should create a new brick", async () => {
    const files = await loadTemplate({
      targetType: TargetType.A_NEW_BRICK,
      packageName: "for-good",
      brickName: "for-better",
      processorName: "",
      targetRoot: "dist",
    });
    expect(files).toMatchSnapshot();
  });
  it("should create a new custom template", async () => {
    const files = await loadTemplate({
      targetType: TargetType.A_NEW_CUSTOM_TEMPLATE,
      packageName: "for-good",
      brickName: "for-better",
      processorName: "",
      targetRoot: "dist",
    });
    expect(files).toMatchSnapshot();
  });
  it("should create a new package of bricks", async () => {
    const files = await loadTemplate({
      targetType: TargetType.A_NEW_PACKAGE_OF_BRICKS,
      packageName: "for-good",
      brickName: "for-better",
      processorName: "",
      targetRoot: "dist",
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
  it("should create a new package of bricks without any bricks", async () => {
    const files = await loadTemplate({
      targetType: TargetType.A_NEW_PACKAGE_OF_BRICKS,
      packageName: "for-good",
      brickName: "",
      processorName: "",
      targetRoot: "dist",
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
  it("should create a new package of libs", async () => {
    const files = await loadTemplate({
      targetType: TargetType.A_NEW_PACKAGE_OF_LIBS,
      packageName: "for-good",
      brickName: "",
      processorName: "",
      targetRoot: "dist",
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
  it("should create a new custom provider", async () => {
    const files = await loadTemplate({
      targetType: TargetType.A_NEW_CUSTOM_PROVIDER,
      packageName: "for-good",
      brickName: "get-data",
      processorName: "",
      targetRoot: "dist",
    });
    expect(files).toMatchSnapshot();
  });
  it("should create a new custom processor", async () => {
    const files = await loadTemplate({
      targetType: TargetType.A_NEW_CUSTOM_PROCESSOR,
      packageName: "for-good",
      brickName: "",
      processorName: "doGood",
      targetRoot: "dist",
    });
    expect(files).toMatchSnapshot();
  });
  it("should create a new package of providers", async () => {
    const files = await loadTemplate({
      targetType: TargetType.A_NEW_PACKAGE_OF_PROVIDERS,
      packageName: "for-good",
      brickName: "",
      processorName: "",
      targetRoot: "dist",
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
  it("should create a new package of dll", async () => {
    const files = await loadTemplate({
      targetType: TargetType.A_NEW_PACKAGE_OF_DLL,
      packageName: "for-good",
      brickName: "",
      processorName: "",
      targetRoot: "dist",
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
});
