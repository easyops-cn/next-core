import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import { Model } from "../lib/internal";
import { Context } from "../lib/internal";
import { modelDir } from "./env";
import { expectDocVersion } from "../utils";

export function loadModel(
  context: Context,
  serviceSeg: string,
  modelSeg: string
): Model {
  const key = `${serviceSeg}/${modelSeg}`;
  let model: Model;
  if (context.modelMap.has(key)) {
    model = context.modelMap.get(key);
  } else {
    const filePath = path.join(modelDir, `${key}.yaml`);
    const doc = yaml.safeLoad(fs.readFileSync(filePath, "utf8")) as any;
    expectDocVersion(doc);
    model = new Model(doc, context, serviceSeg, modelSeg);
    context.modelMap.set(key, model);
    let modelsByService: string[];
    if (context.modelByServiceExportsMap.has(serviceSeg)) {
      modelsByService = context.modelByServiceExportsMap.get(serviceSeg);
    } else {
      modelsByService = [];
      context.modelByServiceExportsMap.set(serviceSeg, modelsByService);
      context.indexModelExports.push(serviceSeg);
    }
    modelsByService.push(model.displayName);
  }
  return model;
}
