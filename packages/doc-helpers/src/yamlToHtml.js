import jsYaml from "js-yaml";
import {
  UNPAIRED_TAGS,
  findPropertyManifests,
  propNameToAttrName,
} from "./htmlToYaml.js";

const { safeLoad, JSON_SCHEMA } = jsYaml;

/**
 * @typedef {import("@next-core/brick-manifest").PackageManifest} PackageManifest
 * @typedef {import("@next-core/brick-manifest").BrickManifest} BrickManifest
 * @typedef {import("@next-core/brick-manifest").PropertyManifest} PropertyManifest
 * @typedef {Map<string, ExtraScripts>} ExtraScriptsMap
 * @typedef {{ props: Record<string, unknown>; events: Map<string, unknown[]>; }} ExtraScripts
 * @typedef {{ manifests: PackageManifest[]; idGenerator: () => string; extraScriptsMap: ExtraScriptsMap; }} ParseContext
 */

/**
 * @param {string} yaml
 * @param {PackageManifest[]} manifests
 * @returns {string}
 */
export default function yamlToHtml(yaml, manifests) {
  const node = safeLoad(yaml, { schema: JSON_SCHEMA, json: true });
  const nodes = Array.isArray(node) ? node : [node];

  let counter = 1;
  const idGenerator = () => `brick-${counter++}`;
  /** @type {ExtraScriptsMap} */
  const extraScriptsMap = new Map();

  const htmlNodes = parseNodes(nodes, {
    manifests,
    idGenerator,
    extraScriptsMap,
  });

  const html = htmlStringifyNodes(htmlNodes, "");

  if (extraScriptsMap.size === 0) {
    return html;
  }

  const scripts = [...extraScriptsMap.entries()].map(([id, extraScripts]) => {
    const varName = id.replace("-", "_");
    return [
      `const ${varName} = document.getElementById("${id}");`,

      // Extra props
      ...Object.entries(extraScripts.props).map(
        ([k, v]) =>
          `${varName}${getAccessor(k)} = ${JSON.stringify(v, null, 2)};`
      ),

      // Events
      ...[...extraScripts.events.entries()].flatMap(([eventType, handlers]) =>
        handlers.map((handler) => {
          return `${varName}.addEventListener(${JSON.stringify(
            eventType
          )}, (e) => {
  ${(() => {
    switch (handler.action) {
      case "console.log":
      case "console.info":
      case "console.warn":
      case "console.error":
        return `${handler.action}(${
          Array.isArray(handler.args)
            ? handler.args.map(getEventArgument).join(", ")
            : ""
        })`;
      case "message.success":
      case "message.info":
      case "message.warn":
      case "message.error":
        return `alert(${
          Array.isArray(handler.args) && handler.args.length > 0
            ? getEventArgument(handler.args[0])
            : ""
        });`;
    }
    if (handler.target) {
      const lines = [
        handler.target === "_self"
          ? `const brick = e.target;`
          : `const brick = document.querySelector(${JSON.stringify(
              handler.target
            )});`,
      ];
      if (handler.method) {
        lines.push(
          `  brick${getAccessor(handler.method)}(${
            Array.isArray(handler.args)
              ? handler.args.map(getEventArgument).join(", ")
              : ""
          });`
        );
      } else if (isObject(handler.properties)) {
        lines.push(
          ...Object.entries(handler.properties).map(
            ([k, v]) =>
              `  brick${getAccessor(k)} = ${JSON.stringify(v, null, 2)};`
          )
        );
      }
      return lines.join("\n");
    }
    return "// Todo";
  })()}
});`;
        })
      ),
    ].join("\n");
  });

  return `${html}\n\n<script>\n${scripts.join("\n\n")}\n</script>`;
}

/**
 * @param {any[]} nodes
 * @param {ParseContext} ctx
 * @returns {any[]}
 */
function parseNodes(nodes, ctx) {
  return nodes.map((node) => parseNode(node, ctx)).filter(Boolean);
}

/**
 * @param {any} node
 * @param {ParseContext} ctx
 * @returns {any}
 */
function parseNode(node, ctx) {
  const { manifests, idGenerator, extraScriptsMap } = ctx;
  const tagName = node.brick;
  const attributes = [];
  let textContent;

  if (node.slot) {
    attributes.push({
      name: "slot",
      value: String(node.slot),
    });
  }

  let id;

  if (isObject(node.properties)) {
    id = node.properties.id;

    const propertyManifests = tagName.includes("-")
      ? findPropertyManifests(tagName, manifests) ?? []
      : [];
    const propertyManifestMap = new Map(
      propertyManifests.map((prop) => [prop.name, prop])
    );

    for (const [propName, propValue] of Object.entries(node.properties)) {
      if (propName === "className") {
        attributes.push({
          name: "class",
          value: String(propValue),
        });
      } else if (propName === "textContent") {
        textContent = String(propValue).trim().replace(/\s+/g, " ");
      } else if (propName === "style") {
        if (isObject(propValue)) {
          attributes.push({
            name: "style",
            value: Object.entries(propValue)
              .map(([k, v]) => `${propNameToAttrName(k)}: ${v}`)
              .join("; "),
          });
        }
      } else if (propName === "dataset") {
        if (isObject(propValue)) {
          for (const [k, v] of Object.entries(propValue)) {
            attributes.push({
              name: `data-${k}`,
              value: String(v),
            });
          }
        }
      } else if (propName !== "id") {
        const prop = propertyManifestMap.get(propName);
        if (prop) {
          if (prop.attribute === false) {
            id ??= idGenerator();
            const extraScripts = extraScriptsMap.get(id);
            if (extraScripts) {
              extraScripts.props[propName] = propValue;
            } else {
              extraScriptsMap.set(id, {
                props: { [propName]: propValue },
                events: new Map(),
              });
            }
          } else {
            const attrName =
              typeof prop.attribute === "string"
                ? prop.attribute
                : propNameToAttrName(propName);
            if (prop.type === "boolean") {
              if (propValue) {
                attributes.push({
                  name: attrName,
                  value: null,
                });
              }
            } else {
              attributes.push({
                name: attrName,
                value: String(propValue),
              });
            }
          }
        } else {
          if (typeof propValue === "boolean") {
            if (propValue) {
              attributes.push({
                name: propNameToAttrName(propName),
                value: null,
              });
            }
          } else {
            attributes.push({
              name: propNameToAttrName(propName),
              value: String(propValue),
            });
          }
        }
      }
    }
  }

  if (isObject(node.events)) {
    id ??= idGenerator();
    for (const [eventType, handler] of Object.entries(node.events)) {
      const handlers = [].concat(handler);
      const extraScripts = extraScriptsMap.get(id);
      if (extraScripts) {
        extraScripts.events.set(eventType, handlers);
      } else {
        extraScriptsMap.set(id, {
          props: {},
          events: new Map([[eventType, handlers]]),
        });
      }
    }
  }

  if (id) {
    attributes.push({ name: "id", value: id });
  }

  let children;
  if (isObject(node.slots)) {
    children = parseNodes(slotsToChildren(node.slots), ctx);
  } else if (Array.isArray(node.children)) {
    children = parseNodes(node.children, ctx);
  }

  return {
    tagName,
    attributes,
    textContent,
    children,
  };
}

function htmlStringifyNodes(nodes, indent) {
  return nodes.map((node) => htmlStringifyNode(node, indent)).join("\n");
}

function htmlStringifyNode(node, indent) {
  const startTag = `${indent}<${node.tagName}${node.attributes
    .map((attr) => ` ${htmlStringifyAttr(attr)}`)
    .join("")}>`;

  if (UNPAIRED_TAGS.includes(node.tagName)) {
    return startTag;
  }

  if (node.children?.length) {
    return [
      ...(startTag.length > 80
        ? [
            `${indent}<${node.tagName}`,
            ...node.attributes.map(
              (attr) => `${indent}  ${htmlStringifyAttr(attr)}`
            ),
            `${indent}>`,
          ]
        : [startTag]),
      htmlStringifyNodes(node.children, `${indent}  `),
      `${indent}</${node.tagName}>`,
    ].join("\n");
  }

  const text = htmlTagEntity(node.textContent ?? "");
  const singleLine = `${startTag}${text}</${node.tagName}>`;

  if (startTag.length > 80 || (singleLine.length > 80 && !text)) {
    const startTagLines = [
      `${indent}<${node.tagName}`,
      ...node.attributes.map((attr) => `${indent}  ${htmlStringifyAttr(attr)}`),
      `${indent}>`,
    ].join("\n");
    if (!text) {
      return `${startTagLines}</${node.tagName}>`;
    }
    return [
      startTagLines,
      `${indent}  ${text}`,
      `${indent}</${node.tagName}>`,
    ].join("\n");
  }

  if (singleLine.length > 80) {
    return [startTag, `${indent}  ${text}`, `${indent}</${node.tagName}>`].join(
      "\n"
    );
  }

  return singleLine;
}

function htmlStringifyAttr(attr) {
  if (attr.value === null) {
    return attr.name;
  }
  return `${attr.name}="${htmlAttrEntity(attr.value)}"`;
}

/**
 * @param {string} raw
 */
export function htmlTagEntity(raw) {
  return raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * @param {string} raw
 */
function htmlAttrEntity(raw) {
  return htmlTagEntity(raw).replace(/"/g, "&quot;");
}

function isObject(object) {
  return typeof object === "object" && !!object;
}

function slotsToChildren(slots) {
  return Object.entries(slots).flatMap(([slot, { bricks }]) =>
    bricks.map((item) => ({
      ...item,
      slot,
    }))
  );
}

/**
 * @param {string} key
 * @returns {string}
 */
function getAccessor(key) {
  return /^\w[\w\d]*$/.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`;
}

/**
 * @param {string} arg
 * @returns {string}
 */
function getEventArgument(arg) {
  if (typeof arg === "string") {
    const matches = arg.match(
      /^\s*<%[~=]?\s+EVENT(?:\s*\.\s*(detail|target))?\s+%>\s*$/
    );
    if (matches) {
      return `e${matches[1] ? `.${matches[1]}` : ""}`;
    }
  }
  return JSON.stringify(arg);
}
