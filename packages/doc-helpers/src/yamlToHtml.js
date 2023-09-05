import jsYaml from "js-yaml";
import * as prettier from "prettier";
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
 * @returns {Promise<string>}
 */
export default async function yamlToHtml(yaml, manifests) {
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
    return await prettier.format(html, {
      filepath: "demo.html",
      trailingComma: "es5",
    });
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
${stringifyHandler(handler)}
});`;
        })
      ),
    ].join("\n");
  });

  return await prettier.format(
    `${html}\n\n<script>\n${scripts.join("\n\n")}\n</script>`,
    {
      filepath: "demo.html",
      trailingComma: "es5",
    }
  );
}

function stringifyHandler(
  handler,
  e = "e",
  indent = "  ",
  expectEventDetail = false
) {
  if (handler.action) {
    switch (handler.action) {
      case "console.log":
      case "console.info":
      case "console.warn":
      case "console.error":
      case "window.open":
        return `${indent}${handler.action}(${
          Array.isArray(handler.args)
            ? handler.args
                .map((arg) => getEventArgument(e, arg, expectEventDetail))
                .join(", ")
            : getEventArgument(e, "<% EVENT.detail %>", expectEventDetail)
        })`;
      case "message.success":
      case "message.info":
      case "message.warn":
      case "message.error":
        return [
          `${indent}const message = document.createElement("basic.show-notification");`,
          `${indent}message.resolve({ type: "${
            handler.action.split(".")[1]
          }", message: ${
            Array.isArray(handler.args) && handler.args.length > 0
              ? `${getEventArgument(e, handler.args[0], expectEventDetail)}`
              : "undefined"
          } });`,
        ].join("\n");
    }
  } else if (handler.target) {
    const lines = [
      handler.target === "_self"
        ? `${indent}const brick = ${e}.target;`
        : `${indent}const brick = document.querySelector(${JSON.stringify(
            handler.target
          )});`,
    ];
    if (handler.method) {
      lines.push(
        `${indent}brick${getAccessor(handler.method)}(${
          Array.isArray(handler.args)
            ? handler.args
                .map((arg) => getEventArgument(e, arg, expectEventDetail))
                .join(", ")
            : ""
        });`
      );
    } else if (isObject(handler.properties)) {
      lines.push(
        ...Object.entries(handler.properties).map(
          ([k, v]) =>
            `${indent}brick${getAccessor(k)} = ${JSON.stringify(v, null, 2)};`
        )
      );
    }
    return lines.join("\n");
  } else if (handler.useProvider) {
    const lines = [
      `${indent}const provider = document.createElement(${JSON.stringify(
        String(handler.useProvider)
      )});`,
    ];
    const resolve = `provider.${
      handler.method === "saveAs" ? "saveAs" : "resolve"
    }(${
      Array.isArray(handler.args)
        ? handler.args
            .map((arg) => getEventArgument(e, arg, expectEventDetail))
            .join(", ")
        : ""
    })`;
    if (handler.callback) {
      lines.push(`${indent}const promise = Promise.resolve(${resolve});`);
      const nextE = `r${indent.length === 2 ? "" : indent.length / 2}`;
      for (const [type, method] of Object.entries({
        success: "then",
        error: "catch",
        finally: "finally",
      })) {
        if (handler.callback[type]) {
          for (const child of [].concat(handler.callback[type])) {
            lines.push(`${indent}promise.${method}((${
              type === "finally" ? "" : nextE
            }) => {
${stringifyHandler(child, nextE, indent + "  ", true)}
${indent}});`);
          }
        }
      }
    } else {
      lines.push(`${indent}${resolve};`);
    }
    return lines.join("\n");
  }
  return `${indent}// WARN: encountered incompatible event handlers in HTML mode, please try YAML.`;
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
  if (node.tagName.startsWith(":")) {
    return `<!-- WARN: "${node.tagName}" is not supported in HTML mode, please try YAML. -->`;
  }
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
 * @param {string} e
 * @param {string} arg
 * @param {boolean=} expectEventDetail
 * @returns {string}
 */
function getEventArgument(e, arg, expectEventDetail) {
  if (typeof arg === "string") {
    const matches = arg.match(
      /^\s*<%[~=]?\s+EVENT(?:\s*\.\s*(detail|target))?\s+%>\s*$/
    );
    if (matches) {
      if (expectEventDetail) {
        if (matches[1] === "detail") {
          return e;
        }
      } else {
        return `${e}${matches[1] ? `.${matches[1]}` : ""}`;
      }
    }
    if (/^\s*<%[~=]?\s/.test(arg) && /\s+%>\s*$/.test(arg)) {
      return `/* WARN: incompatible expressions in HTML, please try YAML: */\n  ${JSON.stringify(
        arg
      )}`;
    }
  }
  return JSON.stringify(arg);
}
