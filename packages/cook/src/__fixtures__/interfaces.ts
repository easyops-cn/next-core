export type NormalizedCase = [string, MultipleCasePairs];

export type LooseCase = [string, SingleCasePair | MultipleCasePairs];

export interface SingleCasePair extends CasePair {
  source: string;
}

export interface MultipleCasePairs {
  source: string;
  cases: CasePair[];
}

export interface CasePair {
  args: unknown[];
  result?: unknown;
}
