// Ref https://github.com/ReactTraining/react-router/blob/master/packages/react-router/modules/matchPath.js
import { pathToRegexp, Key } from "path-to-regexp";
import {
  CompileResult,
  CompileOptions,
  MatchOptions,
  MatchResult,
  MatchParams
} from "@easyops/brick-types";

const cache: Map<string, Map<string, CompileResult>> = new Map();
const cacheLimit = 10000;
let cacheCount = 0;

function compilePath(path: string, options: CompileOptions): CompileResult {
  const cacheKey = `${options.end}${options.strict}${options.sensitive}`;
  if (!cache.has(cacheKey)) {
    cache.set(cacheKey, new Map());
  }
  const pathCache = cache.get(cacheKey);

  if (pathCache.has(path)) {
    return pathCache.get(path);
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
  options: MatchOptions & CompileOptions
): MatchResult {
  const { path: p, exact = false, strict = false, sensitive = true } = options;

  const paths = Array.isArray(p) ? p : [p];

  return paths.reduce<MatchResult>((matched, path) => {
    if (matched) {
      return matched;
    }
    const { regexp, keys } = compilePath(path, {
      end: exact,
      strict,
      sensitive
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

    const initialParams: MatchParams = {};

    return {
      path, // the path used to match
      url: path === "/" && url === "" ? "/" : url, // the matched portion of the URL
      isExact, // whether or not we matched exactly
      params: keys.reduce((memo, key, index) => {
        memo[key.name] = values[index];
        return memo;
      }, initialParams)
    };
  }, null);
}
