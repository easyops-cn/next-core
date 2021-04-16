import {
  getRegExpOfSdkJestSpyOnNamespaceUsage,
  getRegExpOfSdkJestSpyOnUsage,
  getRegExpOfSdkMemberOfNamespaceUsage,
  getRegExpOfSdkMemberUsage,
} from "./getRegExpOfSdkUsage";

export function migrateUsageOfLocalName(
  source: string,
  sdkMapOfLocalNameToImportedName: Map<string, string>
): string {
  if (sdkMapOfLocalNameToImportedName.size > 0) {
    return source
      .replace(
        getRegExpOfSdkMemberUsage(sdkMapOfLocalNameToImportedName),
        (_, group, api) =>
          `${sdkMapOfLocalNameToImportedName.get(group)}_${api}`
      )
      .replace(
        getRegExpOfSdkJestSpyOnUsage(sdkMapOfLocalNameToImportedName),
        (_, group, api) =>
          `(${sdkMapOfLocalNameToImportedName.get(group)}_${api} as jest.Mock)`
      );
  }
  return source;
}

export function migrateUsageOfNamespace(
  source: string,
  sdkNamespaceSet: Set<string>
): string {
  if (sdkNamespaceSet.size > 0) {
    return source
      .replace(
        getRegExpOfSdkMemberOfNamespaceUsage(sdkNamespaceSet),
        (_, namespace, group, api) => `${group}_${api}`
      )
      .replace(
        getRegExpOfSdkJestSpyOnNamespaceUsage(sdkNamespaceSet),
        (_, namespace, group, api) => `(${group}_${api} as jest.Mock)`
      );
  }
  return source;
}
