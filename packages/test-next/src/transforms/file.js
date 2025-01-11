// @ts-check
import path from "node:path";
import { pascalCase } from "pascal-case";

// https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/jest/fileTransform.js
export default {
  /**
   * @param {string} _src
   * @param {string} filename
   */
  process(_src, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));
    if (filename.endsWith(".svg")) {
      const pascalCaseFilename = pascalCase(path.parse(filename).name);
      const componentName = `Svg${pascalCaseFilename}`;
      return {
        code: `import React from "react";
          export default React.forwardRef(function ${componentName}(props, ref) {
            return (
              <svg {...props} ref={ref}>{${assetFilename}}</svg>
            );
        };`,
      };
    }
    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};
