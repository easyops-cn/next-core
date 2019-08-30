import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { yamlDir } from "./env";
import { expectDocVersion } from "../utils";

export function loadDefaultTypes(): Map<string, string> {
  const map = new Map<string, string>();
  const typeDir = path.join(yamlDir, "type");
  fs.readdirSync(typeDir).forEach(file => {
    const doc = yaml.safeLoad(
      fs.readFileSync(path.join(typeDir, file), "utf8")
    );
    expectDocVersion(doc);
    map.set(doc.name, doc.type);
  });
  return map;
}
