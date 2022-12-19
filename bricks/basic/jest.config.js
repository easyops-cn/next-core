import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { jestConfigFactory } from "@next-core/jest-config-factory";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default jestConfigFactory({
  cwd: __dirname,
});
