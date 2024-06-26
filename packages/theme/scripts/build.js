import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getStyleByBaseColors } from "@next-core/color-theme";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await fs.writeFile(
  path.resolve(__dirname, "../src/generated.css"),
  [
    getStyleByBaseColors("light", {
      red: "#f24c25",
      green: "#08BF33",
      blue: "#1a7aff",
      amber: "#f7bf02",
      cyan: "#21d4f3",
      orange: "#e38306",
      yellow: "#fadb14",
      teal: "#1dc897",
      purple: "#893ad8",
      pink: "#ff1a79",
      indigo: "#3844e8",
      "deep-purple": "#6641f9",
      "gray-blue": "#778dc3",
    }),
    getStyleByBaseColors(
      "dark",
      {
        red: "#f36546",
        green: "#2ae14e",
        blue: "#4686ff",
        amber: "#f7ba1e",
        cyan: "#21d5f5",
        orange: "#ff9626",
        yellow: "#fbdd17",
        teal: "#1eca99",
        purple: "#8a3bda",
        pink: "#ff1a7c",
        indigo: "#3946ea",
        "deep-purple": "#6743fb",
        "gray-blue": "#798fc5",
      },
      "#17171a"
    ),
  ].join("\n\n")
);
