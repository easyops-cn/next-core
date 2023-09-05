import loadScriptOrStyle from "./loadScriptOrStyle.js";

export default function loadScript(
  src: string,
  prefix?: string,
  attrs?: Record<string, unknown>
): Promise<string>;
export default function loadScript(
  src: string[],
  prefix?: string,
  attrs?: Record<string, unknown>
): Promise<string[]>;
export default function loadScript(
  src: string | string[],
  prefix?: string,
  attrs?: Record<string, unknown>
): Promise<string | string[]> {
  return loadScriptOrStyle("script", src as string, prefix, attrs);
}
