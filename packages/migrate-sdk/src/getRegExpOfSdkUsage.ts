export function getRegExpOfSdkMemberUsage(
  sdkMapOfLocalNameToImportedName: Map<string, string>
): RegExp {
  return new RegExp(
    `\\b(${Array.from(sdkMapOfLocalNameToImportedName.keys())
      .map((localName) => escapeRegExp(localName))
      .join("|")})\\s*\\.\\s*(\\w+)\\b`,
    "g"
  );
}

export function getRegExpOfSdkJestSpyOnUsage(
  sdkMapOfLocalNameToImportedName: Map<string, string>
): RegExp {
  return new RegExp(
    `\\b(?:jest\\s*\\.\\s*)?spyOn\\(\\s*(${Array.from(
      sdkMapOfLocalNameToImportedName.keys()
    )
      .map((localName) => escapeRegExp(localName))
      .join("|")})\\s*,\\s*['"](\\w+)['"]\\s*\\)`,
    "g"
  );
}

export function getRegExpOfSdkMemberOfNamespaceUsage(
  sdkNamespaceSet: Set<string>
): RegExp {
  return new RegExp(
    `\\b(${Array.from(sdkNamespaceSet)
      .map((localName) => escapeRegExp(localName))
      .join("|")})\\s*\\.\\s*(\\w+Api)\\s*\\.\\s*(\\w+)\\b`,
    "g"
  );
}

export function getRegExpOfSdkJestSpyOnNamespaceUsage(
  sdkNamespaceSet: Set<string>
): RegExp {
  return new RegExp(
    `\\b(?:jest\\s*\\.\\s*)?spyOn\\(\\s*(${Array.from(sdkNamespaceSet).join(
      "|"
    )})\\s*\\.\\s*(\\w+Api)\\s*,\\s*['"](\\w+)['"]\\s*\\)`,
    "g"
  );
}

export function getRegExpOfInvalidUsage(
  sdkMapOfLocalNameToImportedName: Map<string, string>,
  sdkNamespaceSet: Set<string>
): RegExp {
  const patterns: string[] = [];
  if (sdkMapOfLocalNameToImportedName.size > 0) {
    patterns.push(
      `\\b(?:${Array.from(sdkMapOfLocalNameToImportedName.keys())
        .map((localName) => escapeRegExp(localName))
        .join("|")})\\s*\\[`
    );
  }
  if (sdkNamespaceSet.size > 0) {
    patterns.push(
      `\\b(?:${Array.from(sdkNamespaceSet)
        .map((localName) => escapeRegExp(localName))
        .join("|")})\\s*\\.\\s*(?:\\w+Api)\\s*\\[`
    );
  }
  return new RegExp(patterns.join("|"), "g");
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
