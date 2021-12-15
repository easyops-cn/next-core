import { rollupFactory } from "@next-core/rollup-config-factory";

export default rollupFactory({
  umdName: "$PascalServiceName$Sdk",
  copyFiles: [
    {
      src: "contracts.json",
      dest: "dist",
    },
  ],
});
