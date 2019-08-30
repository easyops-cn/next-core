import path from "path";
import { loadTemplate } from "./loadTemplate";
import { FileWithContent, TargetType } from "../interface";

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
  it("should create a new brick", () => {
    const files = loadTemplate({
      targetType: TargetType.A_NEW_BRICK,
      packageName: "for-good",
      brickName: "for-better",
      targetRoot: "dist",
      docRoot: "doc"
    });
    expect(files).toMatchSnapshot();
  });
  it("should create a new package of bricks", () => {
    const files = loadTemplate({
      targetType: TargetType.A_NEW_PACKAGE_OF_BRICKS,
      packageName: "for-good",
      brickName: "for-better",
      targetRoot: "dist",
      docRoot: "doc"
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
  it("should create a new package of libs", () => {
    const files = loadTemplate({
      targetType: TargetType.A_NEW_PACKAGE_OF_LIBS,
      packageName: "for-good",
      brickName: "",
      targetRoot: "dist",
      docRoot: "doc"
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
  it("should create a new package of micro-apps", () => {
    const files = loadTemplate({
      targetType: TargetType.A_NEW_PACKAGE_OF_MICRO_APPS,
      packageName: "for-good",
      brickName: "",
      targetRoot: "dist",
      docRoot: "doc"
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
  it("should create a new package of providers", () => {
    const files = loadTemplate({
      targetType: TargetType.A_NEW_PACKAGE_OF_PROVIDERS,
      packageName: "for-good",
      brickName: "",
      targetRoot: "dist",
      docRoot: "doc"
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
  it("should create a new package of dll", () => {
    const files = loadTemplate({
      targetType: TargetType.A_NEW_PACKAGE_OF_DLL,
      packageName: "for-good",
      brickName: "",
      targetRoot: "dist",
      docRoot: "doc"
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
  it("should transform a micro-app", () => {
    const files = loadTemplate({
      targetType: TargetType.TRANSFORM_A_MICRO_APP,
      packageName: "for-good",
      brickName: "",
      targetRoot: "dist",
      docRoot: "doc"
    });
    const otherFiles = ignoreVersionRelatedFiles(files);
    expect(otherFiles).toMatchSnapshot();
  });
});
