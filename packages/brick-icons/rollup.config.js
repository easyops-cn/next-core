import { rollupFactory, rollupPlugins } from "@next-core/rollup-config-factory";
import svgr from "@svgr/rollup";

export default rollupFactory({
  disableUmd: true,
  plugins: [
    svgr({
      exclude: [
        "src/icons/colored-pseudo-3d/*",
        "src/icons/colored-common/*",
        "src/icons/colored-big-screen/*",
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
        "src/icons/colored-big-screen/*",
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
    rollupPlugins.copy({
      targets: [
        {
          src: "src/styles",
          dest: "dist",
        },
      ],
    }),
  ],
});
