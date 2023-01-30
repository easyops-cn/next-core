import { casesOfBindings } from "./bindings.js";
import { casesOfExpressions } from "./expressions.js";
import { CasePair, MultipleCasePairs, NormalizedCase } from "./interfaces.js";
import { casesOfIterationStatements } from "./iteration-statements/index.js";
import { casesOfMigrated } from "./migrated.js";
import {
  negativeCasesOfExpression,
  selectiveNegativeCasesOfExpression,
} from "./negative/expressions.js";
import {
  negativeCasesOfStatements,
  selectiveNegativeCasesOfStatements,
} from "./negative/statements.js";
import { casesOfPatterns } from "./patterns.js";
import { casesOfSwitchStatements } from "./switch-statements.js";
import { casesOfTryStatements } from "./try-statements.js";

export const positiveCases = [
  ...casesOfMigrated,
  ...casesOfExpressions,
  ...casesOfIterationStatements,
  ...casesOfTryStatements,
  ...casesOfSwitchStatements,
  ...casesOfPatterns,
  ...casesOfBindings,
].map<NormalizedCase>(([desc, { source, ...rest }]) => [
  desc,
  {
    source,
    cases: (rest as MultipleCasePairs).cases || [rest as CasePair],
  },
]);

export const negativeCases = [
  ...negativeCasesOfExpression,
  ...negativeCasesOfStatements,
].map<NormalizedCase>(([desc, { source, ...rest }]) => [
  desc,
  {
    source,
    cases: (rest as MultipleCasePairs).cases || [rest as CasePair],
  },
]);

export const selectiveNegativeCases = [
  ...selectiveNegativeCasesOfExpression,
  ...selectiveNegativeCasesOfStatements,
].map<NormalizedCase>(([desc, { source, ...rest }]) => [
  desc,
  {
    source,
    cases: (rest as MultipleCasePairs).cases || [rest as CasePair],
  },
]);
