import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { yamlDir } from "./env.js";
import { expectDocVersion } from "../utils.js";
import { TypeAndEnum } from "../interface.js";

export function loadDefaultTypes(): Map<string, TypeAndEnum> {
  const map = new Map<string, TypeAndEnum>();
  const typeDir = path.join(yamlDir, "type");
  fs.readdirSync(typeDir).forEach((file) => {
    const doc = yaml.safeLoad(
      fs.readFileSync(path.join(typeDir, file), "utf8")
    ) as any;
    expectDocVersion(doc);
    map.set(doc.name, doc);
  });
  return map;
}
