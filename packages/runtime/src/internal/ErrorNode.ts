import { loadBricksImperatively, BrickLoadError } from "@next-core/loader";
import { HttpResponseError } from "@next-core/http";
import { i18n } from "@next-core/i18n";
import { httpErrorToString } from "../handleHttpError.js";
import { RenderTag } from "./enums.js";
import type { RenderChildNode, RenderReturnNode } from "./interfaces.js";
import { _internalApiGetPresetBricks, getBrickPackages } from "./Runtime.js";
import { K, NS } from "./i18n.js";
import { getBasePath } from "../getBasePath.js";

type ErrorMessageVariant =
  | "internet-disconnected"
  | "no-permission"
  | "license-expired"
  | "not-found"
  | "unknown-error";

interface ErrorMessageConfig {
  title: string;
  variant: ErrorMessageVariant;
  showLink?: LinkType;
  showDescription?: boolean;
}

type LinkType = "home" | "previous" | "reload";

export class PageNotFoundError extends Error {
  constructor(message: "page not found" | "app not found") {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(message);

    this.name = "PageNotFoundError";

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    // istanbul ignore else
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BrickLoadError);
    }
  }
}

/**
 * Will always resolve
 */
export async function ErrorNode(
  error: unknown,
  returnNode: RenderReturnNode,
  pageLevel?: boolean
): Promise<RenderChildNode> {
  const { title, variant, showLink, showDescription } =
    getRefinedErrorConf(error);

  if (pageLevel) {
    const presetBricks = _internalApiGetPresetBricks();
    const errorBrick = presetBricks.error ?? "illustrations.error-message";
    if (errorBrick !== false) {
      const linkBrick = "eo-link";
      const bricks = (showLink ? [errorBrick, linkBrick] : [errorBrick]).filter(
        (brick) => !customElements.get(brick)
      );
      try {
        await Promise.race([
          loadBricksImperatively(bricks, getBrickPackages()),
          // Timeout after 3 seconds
          new Promise<void>((_resolve, reject) =>
            setTimeout(() => {
              reject(new Error("timeout"));
            }, 3e3)
          ),
        ]);
        const node: RenderChildNode = {
          tag: RenderTag.BRICK,
          type: errorBrick,
          properties: {
            errorTitle: title,
            description: showDescription ? httpErrorToString(error) : undefined,
            variant,
            dataset: {
              errorBoundary: "",
            },
          },
          runtimeContext: null!,
          return: returnNode,
        };

        if (showLink) {
          node.child = getLinkNode(showLink, linkBrick, node, "");
        }

        return node;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to load brick:", bricks.join(", "), e);
      }
    }
  }

  const useDefaultError =
    pageLevel && !!customElements.get("easyops-default-error");

  const node: RenderChildNode = {
    tag: RenderTag.BRICK,
    type: useDefaultError ? "easyops-default-error" : "div",
    properties: {
      errorTitle: title,
      dataset: {
        errorBoundary: "",
      },
      style: {
        color: "var(--color-error)",
      },
    },
    runtimeContext: null!,
    return: returnNode,
  };

  const descriptionNode: RenderChildNode = {
    tag: RenderTag.BRICK,
    type: "div",
    properties: {
      textContent: useDefaultError
        ? showDescription
          ? httpErrorToString(error)
          : ""
        : showDescription
          ? `${title}: ${httpErrorToString(error)}`
          : title,
    },
    runtimeContext: null!,
    return: node,
  };

  node.child = descriptionNode;

  if (pageLevel && showLink) {
    descriptionNode.sibling = getLinkNode(
      showLink,
      "a",
      node,
      useDefaultError ? "link" : ""
    );
  }

  return node;
}

function getLinkNode(
  showLink: LinkType | undefined,
  brick: string,
  parent: RenderReturnNode,
  slotId: string
): RenderChildNode {
  return {
    tag: RenderTag.BRICK,
    type: brick,
    slotId,
    properties: {
      textContent:
        showLink === "home"
          ? i18n.t(`${NS}:${K.GO_BACK_HOME}`)
          : showLink === "reload"
            ? i18n.t(`${NS}:${K.RELOAD}`)
            : i18n.t(`${NS}:${K.GO_BACK_TO_PREVIOUS_PAGE}`),
      href:
        showLink === "home"
          ? getBasePath()
          : showLink === "reload"
            ? location.href
            : undefined,
    },
    events:
      showLink === "previous"
        ? {
            click: {
              action: "history.goBack",
            },
          }
        : undefined,
    runtimeContext: null!,
    return: parent,
  };
}

function getRefinedErrorConf(error: unknown): ErrorMessageConfig {
  if (error instanceof PageNotFoundError) {
    return error.message === "app not found"
      ? {
          showLink: "home",
          title: i18n.t(`${NS}:${K.APP_NOT_FOUND}`),
          variant: "no-permission",
        }
      : {
          showLink: "home",
          variant: "not-found",
          title: i18n.t(`${NS}:${K.PAGE_NOT_FOUND}`),
        };
  }

  if (
    error instanceof BrickLoadError ||
    (error instanceof Error && error.name === "ChunkLoadError") ||
    (error instanceof Event &&
      error.type === "error" &&
      error.target instanceof HTMLScriptElement)
  ) {
    return {
      showDescription: true,
      title: i18n.t(`${NS}:${K.NETWORK_ERROR}`),
      variant: "internet-disconnected",
      showLink: "reload",
    };
  }

  if (error instanceof HttpResponseError && error.response?.status === 403) {
    return {
      showLink: "previous",
      showDescription: true,
      title: i18n.t(`${NS}:${K.NO_PERMISSION}`),
      variant: "no-permission",
    };
  }

  if (
    error instanceof HttpResponseError &&
    error.responseJson?.code === "200000"
  ) {
    return {
      showDescription: true,
      title: i18n.t(`${NS}:${K.LICENSE_EXPIRED}`),
      variant: "license-expired",
    };
  }

  return {
    showLink: "previous",
    showDescription: true,
    title: i18n.t(`${NS}:${K.UNKNOWN_ERROR}`),
    variant: "unknown-error",
  };
}
