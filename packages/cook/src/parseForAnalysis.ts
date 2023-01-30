import { parse, type ParserPlugin } from "@babel/parser";
import { ParseResultOfFile } from "./interfaces.js";

export interface AnalysisOptions {
  typescript?: boolean;
  tokens?: boolean;
}

/** For next-core internal or devtools usage only. */
export function parseForAnalysis(
  source: string,
  { typescript, tokens }: AnalysisOptions = {}
): ParseResultOfFile | null {
  try {
    return parse(source, {
      plugins: ["estree", typescript && "typescript"].filter(
        Boolean
      ) as ParserPlugin[],
      strictMode: true,
      attachComment: false,
      // Allow export/import declarations to make analyser handle errors.
      sourceType: "unambiguous",
      tokens,
    });
  } catch (e) {
    // Return no errors if parse failed.
    return null;
  }
}
