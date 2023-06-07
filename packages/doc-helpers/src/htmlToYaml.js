import { XMLParser } from "fast-xml-parser";
import jsYaml from "js-yaml";

const { safeDump, JSON_SCHEMA } = jsYaml;

/**
 * @typedef {import("@next-core/brick-manifest").PackageManifest} PackageManifest
 * @typedef {import("@next-core/brick-manifest").BrickManifest} BrickManifest
 * @typedef {import("@next-core/brick-manifest").PropertyManifest} PropertyManifest
 */

export const UNPAIRED_TAGS = ["br", "hr", "img", "input", "link", "meta"];

const parser = new XMLParser({
  preserveOrder: true,
  processEntities: true,
  htmlEntities: true,
  ignoreAttributes: false,
  removeNSPrefix: true,
  allowBooleanAttributes: true,
  parseTagValue: false,
  parseAttributeValue: false,
  unpairedTags: UNPAIRED_TAGS,
  stopNodes: ["*.script"],
  trimValues: false,
});

/**
 * @param {string} html
 * @param {PackageManifest[]} manifests
 * @returns {string}
 */
export default function htmlToYaml(html, manifests) {
  const [{ root }] = parser.parse(`<root>${html}</root>`);

  const bricks = parseNodes(root, manifests);
  if (bricks.length === 0) {
    return "";
  }
  const result = bricks.length === 1 ? bricks[0] : bricks;
  return safeDump(result, {
    indent: 2,
    schema: JSON_SCHEMA,
    skipInvalid: true,
    noRefs: true,
    noCompatMode: true,
  }).trim();
}

/**
 * @param {any[]} nodes
 * @param {PackageManifest[]} manifests
 * @returns {any[]}
 */
function parseNodes(nodes, manifests) {
  return nodes.map((node) => parseNode(node, manifests)).filter(Boolean);
}

/**
 * @param {any} node
 * @param {PackageManifest[]} manifests
 * @returns {any}
 */
function parseNode(node, manifests) {
  if (node["#text"]) {
    const text = refineText(node["#text"]);
    return text ? { brick: "span", properties: { textContent: text } } : null;
  }
  const tagName = Object.keys(node).find((k) => k !== ":@");
  if (!tagName) {
    throw new Error(
      `HTML tag name not found for node: ${JSON.stringify(node)}`
    );
  }
  const childNodes = node[tagName];
  if (!Array.isArray(childNodes)) {
    throw new Error(`HTML node has no array children: ${JSON.stringify(node)}`);
  }

  const lowerTagName = tagName.toLowerCase();

  if (lowerTagName === "script") {
    return null;
  }

  const propertyManifests = lowerTagName.includes("-")
    ? findPropertyManifests(lowerTagName, manifests) ?? []
    : [];

  let slot = undefined;
  let dataset = undefined;
  let properties = Object.fromEntries(
    Object.entries(node[":@"] ?? {})
      .map(([k, v]) => {
        console.assert(k.startsWith("@_"), "Invalid html attribute key:", k);
        let propName = k.substring(2).toLowerCase();
        let propValue = v;
        if (propName === "class") {
          propName = "className";
        } else if (propName === "style") {
          propValue = Object.fromEntries(
            v
              .split(";")
              .map((pair) => {
                const colonIndex = pair.indexOf(":");
                if (colonIndex > -1) {
                  return [
                    pair
                      .substring(0, colonIndex)
                      .trim()
                      .replace(/-./g, (char) => char[1].toUpperCase()),
                    pair.substring(colonIndex + 1).trim(),
                  ];
                }
              })
              .filter(Boolean)
          );
        } else if (propName.startsWith("data-")) {
          dataset ??= {};
          dataset[propName.substring(5)] = propValue;
          return;
        } else if (propName === "slot") {
          slot = propValue;
          return;
        } else {
          const prop = findPropertyManifestByAttr(propName, propertyManifests);
          if (prop) {
            propName = prop.name;
            if (prop.type === "boolean") {
              propValue = propValue !== "false";
            } else if (prop.type === "number") {
              propValue = Number(propValue);
            }
          }
        }
        return [propName, propValue];
      })
      .filter(Boolean)
  );

  properties.dataset = dataset;

  let children;
  if (childNodes.length === 1 && "#text" in childNodes[0]) {
    properties.textContent = refineText(childNodes[0]["#text"]);
  } else {
    children = parseNodes(childNodes, manifests);
    if (children.length === 0) {
      children = undefined;
    }
  }

  if (Object.values(properties).filter((v) => v !== undefined).length === 0) {
    properties = undefined;
  }

  return {
    brick: lowerTagName,
    slot,
    properties,
    children,
  };
}

/**
 * @param {string} text
 * @returns {string}
 */
function refineText(text) {
  if (!/\S/.test(text)) {
    return undefined;
  }
  return text.replace(/^\s+/, " ").replace(/\s+$/, " ");
}

/**
 * @param {string} tagName
 * @param {PackageManifest[]} manifests
 * @returns {PropertyManifest[] | undefined}
 */
export function findPropertyManifests(tagName, manifests) {
  const [namespace, lastName] = tagName.split(".");
  if (lastName) {
    return manifests
      .find((pkg) => pkg.name === namespace)
      ?.bricks.find((brick) => brick.name === tagName)?.properties;
  }
  for (const pkg of manifests) {
    const brick = pkg.bricks.find((item) => item.name === tagName);
    if (brick) {
      return brick.properties;
    }
  }
}

/**
 * @param {string} attrName
 * @param {PropertyManifest[]} properties
 */
export function findPropertyManifestByAttr(attrName, properties) {
  for (const prop of properties) {
    if (
      typeof prop.attribute === "string"
        ? prop.attribute === attrName
        : prop.attribute !== false && propNameToAttrName(prop.name) === attrName
    ) {
      return prop;
    }
  }
}

/**
 * @param {string} propName
 * @returns {string}
 */
export function propNameToAttrName(propName) {
  return propName.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
