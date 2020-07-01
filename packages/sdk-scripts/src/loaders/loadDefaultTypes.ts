import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { yamlDir } from "./env";
import { expectDocVersion } from "../utils";
import { TypeAndEnum } from "../interface";

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
