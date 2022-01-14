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
      cyan: "#21d4f3",
      orange: "#e38306",
      yellow: "#fadb14",
      teal: "#1dc897",
      purple: "#893ad8",
      pink: "#ff1a79",
    }),
    getStyleByBaseColors(
      "dark",
      {
        red: "#f34d27",
        green: "#7bff21",
        blue: "#1a7aff",
        amber: "#f8c004",
        cyan: "#21d5f5",
        orange: "#e48408",
        yellow: "#fbdd17",
        teal: "#1eca99",
        purple: "#8a3bda",
        pink: "#ff1a7c",
      },
      "#17171a"
    ),
  ].join("\n\n")
);
