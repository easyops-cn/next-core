import { rollupFactory } from "@easyops/rollup-config-factory";
import svgr from "@svgr/rollup";

export default rollupFactory({
  umdName: "BrickIcons",
  plugins: [
    svgr({
      svgoConfig: {
        plugins: [
          {
            // Keep `viewbox`
            removeViewBox: false
          },
          {
            convertColors: {
              currentColor: true
            }
          }
        ]
      }
    })
  ]
});
