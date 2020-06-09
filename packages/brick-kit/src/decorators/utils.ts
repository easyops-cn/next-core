import { getRuntime } from "../runtime";

export function warnNativeHtmlElementProperty(key: string): void {
  // Testing env is ignored to simplify dependents testing.
  // istanbul ignore if
  if (
    key in HTMLElement.prototype &&
    // istanbul ignore next
    process.env.NODE_ENV !== "test"
  ) {
    // eslint-disable-next-line no-console
    console[
      getRuntime().getFeatureFlags()["development-mode"] ? "error" : "warn"
    ](
      `"${key}" is a native HTMLElement property, and is deprecated to be used as a brick property.`
    );
  }
}
