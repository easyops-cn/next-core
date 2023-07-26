import { loadBricksImperatively } from "@next-core/loader";
import type { BrickPackage } from "@next-core/brick-types";
import { developHelper } from "@next-core/brick-kit";
import { http } from "@next-core/brick-http";
import initialize from "./initialize";

export function listen(bootstrapStatus: Promise<"ok" | "failed">): void {
  const listener = async ({
    data,
    origin,
  }: MessageEvent<unknown>): Promise<void> => {
    const isPreview = isPreviewMessageContainerStartPreview(data);
    const isUITest = isUITestPreviewInitialize(data);
    if (isPreview || isUITest) {
      window.removeEventListener("message", listener);
      const ok = await initialize(bootstrapStatus, origin);
      if (ok) {
        let agent: PreviewAgent;
        let options: any;
        if (isPreview) {
          ({ agent, ...options } = data.options);

          http.enableCache(true);
          http.on("match-api-cache", (num: number) => {
            window.parent.postMessage(
              {
                type: "match-api-cache",
                sender: "previewer",
                forwardedFor: "builder",
                num,
              },
              origin
            );
          });
          http.setClearCacheIgnoreList(
            options.clearPreviewRequestCacheIgnoreList || []
          );

          if (!agent?.pkg) {
            return legacyConnect(origin, options);
          }
        } else {
          ({ agent, options } = data.payload);
        }
        await loadBricksImperatively([agent.brick], [agent.pkg]);
        const brick = document.createElement(agent.brick) as any;
        await brick.resolve(origin, options);
      }
    }
  };
  window.addEventListener("message", listener);
}

async function legacyConnect(origin: string, options?: unknown): Promise<void> {
  const helperBrickName = "next-previewer.preview-helper";
  await developHelper.loadDynamicBricksInBrickConf({
    brick: helperBrickName,
  });
  const helper = document.createElement(helperBrickName) as any;
  helper.start(origin, options);
}

function isPreviewMessageContainerStartPreview(
  data: unknown
): data is PreviewMessageContainerStartPreview {
  return (
    (data as PreviewMessageContainerStartPreview)?.sender ===
      "preview-container" &&
    (data as PreviewMessageContainerStartPreview).type === "start-preview"
  );
}

function isUITestPreviewInitialize(
  data: unknown
): data is UITestPreviewInitialize {
  return (
    (data as UITestPreviewInitialize)?.channel === "ui-test-preview" &&
    (data as UITestPreviewInitialize).type === "initialize"
  );
}

interface PreviewMessageContainerStartPreview {
  sender: "preview-container";
  type: "start-preview";
  options: PreviewStartOptions;
}

interface PreviewStartOptions {
  agent?: PreviewAgent;
}

interface UITestPreviewInitialize {
  channel: "ui-test-preview";
  type: "initialize";
  payload: UITextConnectPayload;
}

interface PreviewAgent {
  brick: string;
  pkg?: BrickPackage & {
    id: string;
  };
}

interface UITextConnectPayload {
  agent: PreviewAgent;
  options?: unknown;
}
