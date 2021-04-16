import {
  getRegExpOfSdkJestSpyOnUsage,
  getRegExpOfSdkMemberUsage,
  getRegExpOfSdkMemberOfNamespaceUsage,
  getRegExpOfSdkJestSpyOnNamespaceUsage,
} from "./getRegExpOfSdkUsage";

export function getMigrateMapOfImportSpecifierToApiSet(
  source: string,
  sdkMapOfLocalNameToImportedName: Map<string, string>
): Map<string, Set<string>> {
  const migrateMapOfImportSpecifierToApiSet = new Map<string, Set<string>>();

  if (sdkMapOfLocalNameToImportedName.size > 0) {
    const regExpOfSdkMemberUsage = getRegExpOfSdkMemberUsage(
      sdkMapOfLocalNameToImportedName
    );
    let memberMatch: RegExpExecArray;

    while ((memberMatch = regExpOfSdkMemberUsage.exec(source))) {
      const [_, localName, api] = memberMatch;
      const importedName = sdkMapOfLocalNameToImportedName.get(localName);
      const specifier = `${localName}:${importedName}`;
      let namespaceApiSet = migrateMapOfImportSpecifierToApiSet.get(specifier);
      if (!namespaceApiSet) {
        namespaceApiSet = new Set();
        migrateMapOfImportSpecifierToApiSet.set(specifier, namespaceApiSet);
      }
      namespaceApiSet.add(api);
    }

    const regExpOfSdkJestSpyOnUsage = getRegExpOfSdkJestSpyOnUsage(
      sdkMapOfLocalNameToImportedName
    );
    let jestSpyOnMatch: RegExpExecArray;

    while ((jestSpyOnMatch = regExpOfSdkJestSpyOnUsage.exec(source))) {
      const [_, localName, api] = jestSpyOnMatch;
      const importedName = sdkMapOfLocalNameToImportedName.get(localName);
      const specifier = `${localName}:${importedName}`;
      let namespaceApiSet = migrateMapOfImportSpecifierToApiSet.get(specifier);
      if (!namespaceApiSet) {
        namespaceApiSet = new Set();
        migrateMapOfImportSpecifierToApiSet.set(specifier, namespaceApiSet);
      }
      namespaceApiSet.add(api);
    }
  }

  return migrateMapOfImportSpecifierToApiSet;
}

export function getMigrateMapOfImportNamespaceSpecifierToApiSet(
  source: string,
  sdkNamespaceSet: Set<string>
): Map<string, Set<string>> {
  const migrateMapOfImportNamespaceSpecifierToApiSet = new Map<
    string,
    Set<string>
  >();

  if (sdkNamespaceSet.size > 0) {
    const regExpOfSdkMemberOfNamespaceUsage = getRegExpOfSdkMemberOfNamespaceUsage(
      sdkNamespaceSet
    );
    let memberMatch: RegExpExecArray;

    while ((memberMatch = regExpOfSdkMemberOfNamespaceUsage.exec(source))) {
      const [_, namespace, group, api] = memberMatch;
      let namespaceApiSet = migrateMapOfImportNamespaceSpecifierToApiSet.get(
        namespace
      );
      if (!namespaceApiSet) {
        namespaceApiSet = new Set();
        migrateMapOfImportNamespaceSpecifierToApiSet.set(
          namespace,
          namespaceApiSet
        );
      }
      namespaceApiSet.add(`${group}_${api}`);
    }

    const regExpOfSdkJestSpyOnUsage = getRegExpOfSdkJestSpyOnNamespaceUsage(
      sdkNamespaceSet
    );
    let jestSpyOnMatch: RegExpExecArray;

    while ((jestSpyOnMatch = regExpOfSdkJestSpyOnUsage.exec(source))) {
      const [_, namespace, group, api] = jestSpyOnMatch;
      let namespaceApiSet = migrateMapOfImportNamespaceSpecifierToApiSet.get(
        namespace
      );
      if (!namespaceApiSet) {
        namespaceApiSet = new Set();
        migrateMapOfImportNamespaceSpecifierToApiSet.set(
          namespace,
          namespaceApiSet
        );
      }
      namespaceApiSet.add(`${group}_${api}`);
    }
  }

  return migrateMapOfImportNamespaceSpecifierToApiSet;
}
