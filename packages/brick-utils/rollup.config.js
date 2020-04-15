import { rollupFactory } from "@easyops/rollup-config-factory";

export default rollupFactory({
  umdName: "BrickUtils",
  commonjsOptions: { namedExports: { "file-saver": ["saveAs"] } },
});
