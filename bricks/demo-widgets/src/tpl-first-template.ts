import { customTemplates } from "@next-core/runtime";

customTemplates.define("demo-widgets.tpl-first-template", {
  bricks: [
    {
      brick: "span",
      properties: {
        textContent: "first",
      },
    },
  ],
});
