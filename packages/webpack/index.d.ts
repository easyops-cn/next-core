import { Compiler } from "webpack";

export interface RuntimePluginOptions {
  brickPackages: string[];
}

export class BootstrapPlugin {
  constructor(options: RuntimePluginOptions);
  apply(compiler: Compiler): void;
}

export interface BricksPluginOptions {
  brickPackages: string[];
}

export class BricksPlugin {
  constructor(options: BricksPluginOptions);
  apply(compiler: Compiler): void;
}
