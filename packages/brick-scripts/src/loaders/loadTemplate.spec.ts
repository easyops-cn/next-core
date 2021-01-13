import path from "path";
import { loadTemplate } from "./loadTemplate";
import { FileWithContent, TargetType } from "../interface";
import { getEasyopsConfig } from "../getEasyopsConfig";

jest.mock("../getEasyopsConfig");
(getEasyopsConfig as jest.Mock).mockReturnValue({
  contractYamlDir: "easyops",
  contractUrl: "https://github.com/easyops-cn/contract-center.git",
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
      templateName: "",
      processorName: "",
      targetRoot: "dist",
    });
    expect(files).toMatchSnapshot();
  });
  it("should create a new editor brick", async () => {
    const files = await loadTemplate({
      targetType: TargetType.A_NEW_EDITOR_BRICK,
      packageName: "for-good",
      brickName: "for-better",
      templateName: "",
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
      templateName: "",
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
      templateName: "",
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
      templateName: "",
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
      templateName: "",
      processorName: "",
      targetRoot: "dist",
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
  it("should create a new package of micro-apps", async () => {
    const files = await loadTemplate({
      targetType: TargetType.A_NEW_PACKAGE_OF_MICRO_APPS,
      packageName: "for-good",
      brickName: "",
      templateName: "",
      processorName: "",
      targetRoot: "dist",
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
  it("should create a new custom provider brick", async () => {
    const files = await loadTemplate({
      targetType: TargetType.A_NEW_CUSTOM_PROVIDER_BRICK,
      packageName: "for-good",
      brickName: "get-data",
      templateName: "",
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
      templateName: "",
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
      templateName: "",
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
      templateName: "",
      processorName: "",
      targetRoot: "dist",
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
  it("should transform a micro-app", async () => {
    const files = await loadTemplate({
      targetType: TargetType.TRANSFORM_A_MICRO_APP,
      packageName: "for-good",
      brickName: "",
      templateName: "",
      processorName: "",
      targetRoot: "dist",
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
  it("should create a new legacy template", async () => {
    const files = await loadTemplate({
      targetType: TargetType.A_NEW_LEGACY_TEMPLATE,
      packageName: "for-good",
      brickName: "",
      templateName: "for-better",
      processorName: "",
      targetRoot: "dist",
    });
    expect(files).toMatchSnapshot();
  });
  it("should create a new package of legacy templates", async () => {
    const files = await loadTemplate({
      targetType: TargetType.A_NEW_PACKAGE_OF_LEGACY_TEMPLATES,
      packageName: "for-good",
      brickName: "",
      templateName: "for-better",
      processorName: "",
      targetRoot: "dist",
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
  it("should i18n-patch a package of legacy templates", async () => {
    const files = await loadTemplate({
      targetType: TargetType.I18N_PATCH_A_PACKAGE_OF_LEGACY_TEMPLATES,
      packageName: "for-good",
      brickName: "",
      templateName: "",
      processorName: "",
      targetRoot: "dist",
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
});
