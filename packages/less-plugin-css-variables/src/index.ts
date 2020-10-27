import { LessReplacer } from "./LessReplacer";

export const lessReplacePlugin = {
  install: (less: unknown, pluginManager: any): void => {
    pluginManager.addPreProcessor(new LessReplacer(), 2000);
  },
  minVersion: [2, 7, 1],
};
