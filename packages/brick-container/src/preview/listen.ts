import { loadBricksImperatively } from "@next-core/loader";
import type { BrickPackage } from "@next-core/types";
import initialize from "./initialize.js";

export function listen(bootstrapStatus: Promise<"ok" | "failed">) {
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
  agent: PreviewAgent;
}

interface UITestPreviewInitialize {
  channel: "ui-test-preview";
  type: "initialize";
  payload: UITextConnectPayload;
}

interface PreviewAgent {
  brick: string;
  pkg: BrickPackage;
}

interface UITextConnectPayload {
  agent: PreviewAgent;
  options?: unknown;
}
