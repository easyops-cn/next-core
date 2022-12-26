import type { Compiler, Configuration, RuleSetRule, container } from "webpack";

export declare function build(config: BuildNextBricksConfig): Compiler;

export interface BuildNextBricksConfig {
  type?: "bricks" | "container" | "brick-playground";
  mode?: "development" | "production";
  entry?: Record<string, string>;
  extractCss?: boolean;
  plugins?: Configuration["plugins"];
  moduleRules?: RuleSetRule;
  exposes?: ConstructorParameters<typeof container.ModuleFederationPlugin>;
}
