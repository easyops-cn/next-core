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
        code: `"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
var _default = exports.default = /*#__PURE__*/_react.default.forwardRef(function ${componentName}(props, ref) {
  return /*#__PURE__*/_react.default.createElement("svg", _extends({}, props, {
    ref: ref
  }), ${assetFilename});
});`,
      };
    }
    return {
      code: `module.exports = ${assetFilename};`,
    };
  },
};
