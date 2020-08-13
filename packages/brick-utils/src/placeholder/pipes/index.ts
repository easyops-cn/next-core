// This whole folder will be moved to GitHub.
import * as pipes from "./pipes";
import {
  formatValue,
  convertValueByPrecision,
} from "./pipes/unitFormat/func/valueFormatter";

export default pipes;

export const utils = {
  formatValue,
  convertValueByPrecision,
};
