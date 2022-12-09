import type { Compiler, Configuration, RuleSetRule } from "webpack";

export const build: (config: BuildNextBricksConfig) => Compiler;

export interface BuildNextBricksConfig {
  type?: "container" | "bricks";
  mode?: "development" | "production";
  entry?: Record<string, string>;
  extractCss?: boolean;
  plugins?: Configuration["plugins"];
  moduleRules?: RuleSetRule;
}
