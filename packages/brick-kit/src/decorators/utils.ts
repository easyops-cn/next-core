import { getRuntime } from "../runtime";
import { PropertyDeclaration } from "../UpdatingElement";

export function warnNativeHtmlElementProperty(
  key: string,
  options?: PropertyDeclaration
): void {
  // Testing env is ignored to simplify dependents testing.
  // istanbul ignore if
  if (
    key in HTMLElement.prototype &&
    !options?.__deprecated_and_for_compatibility_only &&
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
