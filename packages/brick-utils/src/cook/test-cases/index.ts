import { casesOfBindings } from "./bindings";
import { casesOfExpressions } from "./expressions";
import { CasePair, MultipleCasePairs, NormalizedCase } from "./interfaces";
import { casesOfIterationStatements } from "./iteration-statements";
import { casesOfMigrated } from "./migrated";
import {
  negativeCasesOfExpression,
  selectiveNegativeCasesOfExpression,
} from "./negative/expressions";
import {
  negativeCasesOfStatements,
  selectiveNegativeCasesOfStatements,
} from "./negative/statements";
import { casesOfPatterns } from "./patterns";
import { casesOfSwitchStatements } from "./switch-statements";
import { casesOfTryStatements } from "./try-statements";

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
