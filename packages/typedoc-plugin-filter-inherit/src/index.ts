// istanbul ignore file temporary
import { Application } from "typedoc/dist/lib/application";
import { ParameterType } from "typedoc/dist/lib/utils/options/declaration";
import { ALLOW_INHERIT_OPTIONS } from "./constants";
import { FilterInheritPlugin } from "./plugin";

export = (PluginHost: Application) => {
  const app = PluginHost.owner;
  app.options.addDeclaration({
    name: ALLOW_INHERIT_OPTIONS,
    help: "inherited whitelist",
    type: ParameterType.Array,
  });

  app.converter.addComponent(
    "filter-inherit",
    new FilterInheritPlugin(app.converter)
  );
};
