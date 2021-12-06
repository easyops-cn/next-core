import { rollupFactory } from "@next-core/rollup-config-factory";
import svgr from "@svgr/rollup";
import url from "@rollup/plugin-url";
import path from "path";

export default rollupFactory({
  umdName: "BrickKit",
  plugins: [
    svgr({
      svgoConfig: {
        plugins: [
          {
            // Keep `viewbox`
            removeViewBox: false,
          },
        ],
      },
    }),
    url({
      include: ["**/*.png"],
      fileName: "[dirname][name].[hash][extname]",
      destDir: "dist/illustrations",
      limit: 0,
      sourceDir: path.join(__dirname, "src", "images"),
    }),
  ],
});
