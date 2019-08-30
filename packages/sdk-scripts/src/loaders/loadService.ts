import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { Context } from "../lib/internal";
import { apiDir } from "./env";
import { Api } from "../lib/internal";
import { expectDocVersion } from "../utils";

export function loadService(serviceSeg: string): Context {
  const context = new Context(serviceSeg);

  const serviceDir = path.join(apiDir, serviceSeg);
  fs.readdirSync(serviceDir, { withFileTypes: true }).forEach(dirent => {
    if (!dirent.isDirectory()) {
      return;
    }
    const modelSeg = dirent.name;
    const exportApiDisplayNames: string[] = [];
    context.apiByModelExportsMap.set(modelSeg, exportApiDisplayNames);
    context.indexApiExports.push(modelSeg);

    const modelDir = path.join(serviceDir, modelSeg);
    fs.readdirSync(modelDir).forEach(file => {
      const filePath = path.join(modelDir, file);
      const doc = yaml.safeLoad(fs.readFileSync(filePath, "utf8"));
      expectDocVersion(doc);
      const apiSeg = path.basename(file, ".yaml");
      const key = `${serviceSeg}/${modelSeg}/${apiSeg}`;
      const api = new Api(doc, context, modelSeg);
      exportApiDisplayNames.push(api.displayName);
      context.apiMap.set(key, api);
    });
  });

  return context;
}
