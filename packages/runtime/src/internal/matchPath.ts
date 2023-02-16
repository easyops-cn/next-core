// Ref https://github.com/ReactTraining/react-router/blob/master/packages/react-router/modules/matchPath.js
import type { LegacyCompatibleRuntimeContext } from "@next-core/inject";
import { pathToRegexp, Key, compile } from "path-to-regexp";

const cache: Map<string, Map<string, CompileResult>> = new Map();
const cacheLimit = 10000;
let cacheCount = 0;

function compilePath(path: string, options: CompileOptions): CompileResult {
  const cacheKey = `${options.end}${options.strict}${options.sensitive}`;
  let pathCache = cache.get(cacheKey);
  if (!pathCache) {
    cache.set(cacheKey, (pathCache = new Map()));
  }

  const cacheResult = pathCache.get(path);
  if (cacheResult) {
    return cacheResult;
  }

  const keys: Key[] = [];
  const regexp = pathToRegexp(path, keys, options);
  const result = { regexp, keys };

  if (cacheCount < cacheLimit) {
    pathCache.set(path, result);
    cacheCount++;
  }

  return result;
}

/**
 * Public API for matching a URL pathname to a path.
 */
export function matchPath(
  pathname: string,
  options: MatchPathOptions
): MatchResult | null {
  const { path: p, exact = false, strict = false, sensitive = true } = options;

  const paths = Array.isArray(p) ? p : [p];

  return paths.reduce<MatchResult | null>((matched, path) => {
    if (matched) {
      return matched;
    }
    const { regexp, keys } = compilePath(path, {
      end: exact,
      strict,
      sensitive,
    });
    const match = regexp.exec(pathname);

    if (!match) {
      return null;
    }

    const [url, ...values] = match;
    const isExact = pathname === url;

    if (exact && !isExact) {
      return null;
    }

    const initialParams: MatchResult["params"] = {};
    const result = {
      path, // the path used to match
      url: path === "/" && url === "" ? "/" : url, // the matched portion of the URL
      isExact, // whether or not we matched exactly
      params: keys.reduce((memo, key, index) => {
        memo[key.name] = values[index];
        return memo;
      }, initialParams),
    };

    return result;
  }, null);
}

export function toPath(
  path: string,
  pathParams: Record<string, unknown>
): string {
  return compile(path)(pathParams);
}

interface CompileOptions {
  end?: boolean;
  strict?: boolean;
  sensitive?: boolean;
}

interface CompileResult {
  regexp: RegExp;
  keys: Key[];
}

interface MatchOptions {
  path: string | string[];
  exact?: boolean;
}

type MatchPathOptions = MatchOptions & CompileOptions;

export type MatchResult = Exclude<
  LegacyCompatibleRuntimeContext["match"],
  undefined
>;
