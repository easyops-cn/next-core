// @ts-check
import path from "node:path";
import { pascalCase } from "pascal-case";

// https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/jest/fileTransform.js
export default {
  /**
   * @param {string} src
   * @param {string} filename
   */
  process(src, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));
    if (filename.endsWith(".svg")) {
      const pascalCaseFilename = pascalCase(path.parse(filename).name);
      const componentName = `Svg${pascalCaseFilename}`;
      return {
        code: `const React = require('react');
          module.exports = {
          __esModule: true,
          default: React.forwardRef(function ${componentName}(props, ref) {
            return {
              $$typeof: Symbol.for('react.element'),
              type: 'svg',
              ref: ref,
              key: null,
              props: Object.assign({}, props, {
                children: ${assetFilename}
              })
            };
          }),
        };`,
      };
    }
    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};
