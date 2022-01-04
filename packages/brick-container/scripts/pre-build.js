const fs = require("fs-extra");
const path = require("path");
const { getStyleByBaseColors } = require("@next-core/color-theme");

fs.outputFileSync(
  path.resolve(__dirname, "../src/styles/theme/generated.css"),
  [
    getStyleByBaseColors("light", {
      red: "#f24c25",
      green: "#52c41a",
      blue: "#1a7aff",
      amber: "#f7bf02",
    }),
    getStyleByBaseColors(
      "dark",
      {
        red: "#f34d27",
        green: "#7bff21",
        blue: "#1a7aff",
        amber: "#f8c004",
      },
      "#17171a"
    ),
  ].join("\n\n")
);
