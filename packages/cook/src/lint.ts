import { semanticAnalysis, SemanticAnalysisOptions } from ".";
import { LintError } from "./semanticAnalysis";

export type LintOptions = Pick<SemanticAnalysisOptions, "typescript" | "rules">;

/** For next-core internal or devtools usage only. */
export function lint(
  source: string,
  { typescript, rules }: LintOptions = {}
): LintError[] {
  return semanticAnalysis(source, { typescript, rules }).errors;
}
