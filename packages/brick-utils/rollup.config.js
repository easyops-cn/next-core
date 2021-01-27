import { rollupFactory } from "@next-core/rollup-config-factory";

export default rollupFactory({
  umdName: "BrickUtils",
  commonjsOptions: { namedExports: { "file-saver": ["saveAs"] } },
});
