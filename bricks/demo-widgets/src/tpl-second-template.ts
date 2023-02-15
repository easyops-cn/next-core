import { customTemplates } from "@next-core/runtime";

customTemplates.define("demo-widgets.tpl-second-template", {
  bricks: [
    {
      brick: "span",
      properties: {
        textContent: "second",
      },
    },
  ],
});
