import { rollupFactory, rollupPlugins } from "@next-core/rollup-config-factory";
import path from "path";

export default rollupFactory({
  umdName: "EasyopsIllustrations",
  plugins: [
    rollupPlugins.url({
      include: ["**/*.png", "**/*.gif", "**/*.svg"],
      fileName: "[dirname][name].[hash][extname]",
      destDir: "dist/illustrations",
      limit: 0,
      sourceDir: path.join(__dirname, "src", "images"),
    }),
  ],
});
