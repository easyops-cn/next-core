import type { Compiler, Configuration, RuleSetRule, container } from "webpack";

export declare function build(config: BuildNextBricksConfig): Compiler;
export declare function getSvgrLoaders(options: {
  /** Set it to true for font icons */
  convertCurrentColor?: boolean;
}): RuleSetRule["use"];

// Types of `SharedConfig` and `SharedObject` are copied from webpack.

/**
 * Advanced configuration for modules that should be shared in the share scope.
 */
interface SharedConfig {
  /**
   * Include the provided and fallback module directly instead behind an async request. This allows to use this shared module in initial load too. All possible shared modules need to be eager too.
   */
  eager?: boolean;

  /**
   * Provided module that should be provided to share scope. Also acts as fallback module if no shared module is found in share scope or version isn't valid. Defaults to the property name.
   */
  import?: string | false;

  /**
   * Package name to determine required version from description file. This is only needed when package name can't be automatically determined from request.
   */
  packageName?: string;

  /**
   * Version requirement from module in share scope.
   */
  requiredVersion?: string | false;

  /**
   * Module is looked up under this key from the share scope.
   */
  shareKey?: string;

  /**
   * Share scope name.
   */
  shareScope?: string;

  /**
   * Allow only a single version of the shared module in share scope (disabled by default).
   */
  singleton?: boolean;

  /**
   * Do not accept shared module if version is not valid (defaults to yes, if local fallback module is available and shared module is not a singleton, otherwise no, has no effect if there is no required version specified).
   */
  strictVersion?: boolean;

  /**
   * Version of the provided module. Will replace lower matching versions, but not higher.
   */
  version?: string | false;
}

/**
 * Modules that should be shared in the share scope. Property names are used to match requested modules in this compilation. Relative requests are resolved, module requests are matched unresolved, absolute paths will match resolved requests. A trailing slash will match all requests with this prefix. In this case shareKey must also have a trailing slash.
 */
interface SharedObject {
  [index: string]: string | SharedConfig;
}

export interface BuildNextBricksConfig {
  type?: "bricks" | "container" | "brick-playground";
  mode?: "development" | "production";
  entry?: Record<string, string>;
  /** Defaults to "dist" */
  outputPath?: string;
  devOnlyOutputPublicPath?: string;
  extractCss?: boolean;
  /** Treat svg as React component instead of asset */
  svgAsReactComponent?: boolean;
  /** Customize rules for svg */
  svgRules?: RuleSetRule[];
  /** By default the image assets are named `images/[hash][ext][query]` */
  imageAssetFilename?: string | ((pathData: any, assetInfo: any) => string);
  plugins?: Configuration["plugins"];
  moduleRules?: RuleSetRule[];
  exposes?: ConstructorParameters<typeof container.ModuleFederationPlugin>;
  dependencies?: Record<string, string[]>;
  optimization?: Configuration["optimization"];
  moduleFederationShared?: SharedObject | false;
}
