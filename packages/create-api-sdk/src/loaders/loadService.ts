import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { Context } from "../lib/internal.js";
import { apiDir } from "./env.js";
import { Api } from "../lib/internal.js";
import { expectDocVersion, extractProviderContract } from "../utils.js";
import { i18nYamlFile } from "./env.js";

export function loadService(serviceSeg: string): Context {
  const context = new Context(serviceSeg);

  const serviceDir = path.join(apiDir, serviceSeg);

  const serviceI18nPath = path.join(serviceDir, i18nYamlFile);
  if (fs.existsSync(serviceI18nPath)) {
    const i18nData = yaml.safeLoad(fs.readFileSync(serviceI18nPath, "utf8"));
    for (const [key, value] of Object.entries(i18nData)) {
      context.namespaceI18nMap.set(key, value);
    }
  }

  fs.readdirSync(serviceDir, { withFileTypes: true }).forEach((dirent) => {
    if (!dirent.isDirectory()) {
      return;
    }
    const modelSeg = dirent.name;
    const exportApiDisplayNames: string[] = [];
    context.apiByModelExportsMap.set(modelSeg, exportApiDisplayNames);
    context.indexApiExports.push(modelSeg);

    const modelDir = path.join(serviceDir, modelSeg);
    const modelI18nPath = path.join(modelDir, i18nYamlFile);

    // Clear the last modelId i18n value
    context.modelI18nMap.clear();
    if (fs.existsSync(modelI18nPath)) {
      const modelI18nData = yaml.safeLoad(
        fs.readFileSync(modelI18nPath, "utf8")
      );

      for (const [key, value] of Object.entries(modelI18nData)) {
        context.modelI18nMap.set(key, value);
      }
    }

    fs.readdirSync(modelDir).forEach((file) => {
      if (!(file.endsWith(".yaml") || file.endsWith(".yml"))) {
        return;
      }
      if (file === i18nYamlFile) {
        return;
      }
      const filePath = path.join(modelDir, file);
      const doc = yaml.safeLoad(fs.readFileSync(filePath, "utf8")) as any;
      expectDocVersion(doc);
      context.contractList.push(
        extractProviderContract(context, doc, modelSeg)
      );
      const apiSeg = path.basename(file, ".yaml");
      const key = `${serviceSeg}/${modelSeg}/${apiSeg}`;
      const api = new Api(doc, context, modelSeg);
      exportApiDisplayNames.push(api.filename);
      context.apiMap.set(key, api);
    });
  });

  return context;
}
