import { rollupFactory } from "@easyops/rollup-config-factory";
import svgr from "@svgr/rollup";

export default rollupFactory({
  umdName: "BrickIcons",
  plugins: [
    svgr({
      exclude: "src/icons/colored-pseudo-3d/*",
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
      include: "src/icons/colored-pseudo-3d/*",
      svgoConfig: {
        plugins: [
          {
            // Keep `viewbox`
            removeViewBox: false,
          },
        ],
      },
    }),
  ],
});
