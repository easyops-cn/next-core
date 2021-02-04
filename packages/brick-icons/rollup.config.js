import { rollupFactory } from "@next-core/rollup-config-factory";
import svgr from "@svgr/rollup";
import copy from "rollup-plugin-copy";

export default rollupFactory({
  umdName: "BrickIcons",
  plugins: [
    svgr({
      exclude: [
        "src/icons/colored-pseudo-3d/*",
        "src/icons/colored-common/*",
        "src/icons/product/*",
      ],
      svgoConfig: {
        plugins: [
          {
            // Keep `viewbox`
            removeViewBox: false,
          },
          {
            convertColors: {
              currentColor: true,
            },
          },
        ],
      },
    }),
    svgr({
      include: [
        "src/icons/colored-pseudo-3d/*",
        "src/icons/colored-common/*",
        "src/icons/product/*",
      ],
      svgoConfig: {
        plugins: [
          {
            // Keep `viewbox`
            removeViewBox: false,
          },
        ],
      },
    }),
    copy({
      targets: [
        {
          src: "src/styles",
          dest: "dist",
        },
      ],
    }),
  ],
});
