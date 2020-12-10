import { rollupFactory } from "@easyops/rollup-config-factory";
import url from "@rollup/plugin-url";
import path from "path";

export default rollupFactory({
  umdName: "EasyopsIllustrations",
  plugins: [
    url({
      include: ["**/*.png"],
      publicPath: ["assets/illustrations/"],
      fileName: "[dirname][name].[hash][extname]",
      destDir: "dist/illustrations",
      //  limit: 100000
      sourceDir: path.join(__dirname, "src", "images"),
    }),
  ],
});
