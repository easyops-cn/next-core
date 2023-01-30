import { casesOfForInLoops } from "./for-in-loops.js";
import { casesOfForOfLoops } from "./for-of-loops.js";
import { casesOfWhileLoops } from "./while-loops.js";

export const casesOfIterationStatements = [
  ...casesOfForInLoops,
  ...casesOfForOfLoops,
  ...casesOfWhileLoops,
];
