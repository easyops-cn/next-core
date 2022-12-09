import path from "node:path";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { getStyleByBaseColors } from "@next-core/color-theme";

try {
  const __dirname = fileURLToPath(new URL(".", import.meta.url));
  await writeFile(
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
        indigo: "#3844e8",
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
        },
        "#17171a"
      ),
    ].join("\n\n")
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
