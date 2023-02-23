import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { getEasyopsConfig } from "@next-core/repo-config";
import __dirname from "./__dirname.js";

const isTesting: boolean = process.env.NODE_ENV === "test";

export const testYamlDir = path.join(__dirname, "../../yaml");
export const testApiDir = path.join(testYamlDir, "api");
export const testModelDir = path.join(testYamlDir, "model");

export const tmpDir = isTesting
  ? path.join(os.tmpdir(), "contract")
  : /* c8 ignore next */
    fs.mkdtempSync(path.join(os.tmpdir(), "contract-"));

export const { contractYamlDir } = getEasyopsConfig();
export const easyopsYamlDir = path.join(tmpDir, contractYamlDir);
export const easyopsApiDir = path.join(easyopsYamlDir, "api");
export const easyopsModelDir = path.join(easyopsYamlDir, "model");

export const yamlDir = isTesting
  ? testYamlDir
  : /* c8 ignore next */
    easyopsYamlDir;
export const apiDir = isTesting
  ? testApiDir
  : /* c8 ignore next */
    easyopsApiDir;
export const modelDir = isTesting
  ? testModelDir
  : /* c8 ignore next */
    easyopsModelDir;

export const i18nYamlFile = ".info.yaml";
