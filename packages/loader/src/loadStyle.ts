import loadScriptOrStyle from "./loadScriptOrStyle.js";

export default function loadStyle(
  src: string,
  prefix?: string,
  attrs?: Record<string, unknown>
): Promise<string>;
export default function loadStyle(
  src: string[],
  prefix?: string,
  attrs?: Record<string, unknown>
): Promise<string[]>;
export default function loadStyle(
  src: string | string[],
  prefix?: string,
  attrs?: Record<string, unknown>
): Promise<string | string[]> {
  return loadScriptOrStyle("style", src as string, prefix, attrs);
}
