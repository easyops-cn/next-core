declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.css" {
  const css: string;
  export default css;
}

declare module "*.txt" {
  const source: string;
  export default source;
}

declare module "@ungap/event-target" {
  export default EventTarget;
}

declare module "semver" {
  export function satisfies(version: string, range: string): boolean;
}

interface Window {
  /** A map of versions of core packages. */
  BRICK_NEXT_VERSIONS?: Record<string, string>;

  /** Declare supported features currently. */
  BRICK_NEXT_FEATURES?: string[];

  /** A map of dll name to file path. */
  DLL_PATH?: Record<string, string>;

  /** Markup for v2 adapter */
  MIGRATE_TO_BRICK_NEXT_V3?: boolean;

  // Variables below are for standalone micro-apps only.

  /** Markup for standalone micro-apps. */
  STANDALONE_MICRO_APPS?: boolean;

  /** Markup for standalone brick preview */
  DEVELOPER_PREVIEW?: boolean;

  /** The app needs no auth guard.  */
  NO_AUTH_GUARD?: boolean;

  /** The current app ID. */
  APP_ID?: string;

  /** The app root, E.g. "hello-world/" */
  APP_ROOT?: string;

  /** The app root template, E.g. "sa-static/{id}/versions/{version}/webroot/" */
  APP_ROOT_TPL?: string;

  /** The public cdn, E.g. "https://my.cdn.site/" */
  PUBLIC_CDN?: string;

  /** The public root, E.g. "hello-world/-/" */
  PUBLIC_ROOT?: string;

  /** Whether the public root includes package version. */
  PUBLIC_ROOT_WITH_VERSION?: boolean;

  /** The core root, E.g. "hello-world/-/core/" */
  CORE_ROOT?: string;

  /** The bootstrap filename, E.g. "hello-world/-/bootstrap.abc123.json" */
  BOOTSTRAP_FILE?: string;

  /** The response field of bootstrap file */
  BOOTSTRAP_FILE_FIELD?: string;

  /** the union bootstrap filename  */
  BOOTSTRAP_UNION_FILE?: string;

  /** Mock global date, currently for sandbox demo website only */
  MOCK_DATE?: string;

  /** For standalone usage of bricks */
  STANDALONE_BRICK_PACKAGES?: unknown[];

  DISABLE_REACT_FLUSH_SYNC?: boolean;

  PUBLIC_DEPS?: any[];

  /** For brick next devtools only */
  __dev_only_getAllContextValues(options: {
    tplStateStoreId?: string;
  }): Record<string, unknown>;
}

declare const __webpack_public_path__: string;

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};
