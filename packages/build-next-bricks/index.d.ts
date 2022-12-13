import { Compiler, Configuration, RuleSetRule, container } from "webpack";

export const build: (config: BuildNextBricksConfig) => Compiler;

export interface BuildNextBricksConfig {
  type?: "container" | "bricks";
  mode?: "development" | "production";
  entry?: Record<string, string>;
  extractCss?: boolean;
  plugins?: Configuration["plugins"];
  moduleRules?: RuleSetRule;
  exposes?: ConstructorParameters<typeof container.ModuleFederationPlugin>;
}
