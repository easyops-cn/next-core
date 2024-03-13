import { loadBricksImperatively } from "@next-core/loader";
import { getBrickPackages, getRuntime } from "./internal/Runtime.js";
import { omit } from "lodash";

interface WaterMarkProps {
  container?: HTMLElement;
  content?: string | string[];
  zIndex?: number;
  rotate?: number;
  width?: number;
  height?: number;
  image?: string;
  font?: {
    color?: CanvasFillStrokeStyles["fillStyle"];
    fontSize?: number | string;
    fontWeight?: "normal" | "light" | "weight" | number;
    fontStyle?: "none" | "normal" | "italic" | "oblique";
    fontFamily?: string;
    textAlign?: CanvasTextAlign;
  };
  style?: React.CSSProperties;
  gap?: [number, number];
  offset?: [number, number];
}

let brick: {
  resolve(options: WaterMarkProps): void;
};

export const WATEMARK_BRICKNAME = "advanced.show-watermark";

export function setWatermark({
  version,
  username,
}: {
  version: string;
  username: string;
}) {
  const isDeveloper = version === "0.0.0";
  const flags = getRuntime().getFeatureFlags();
  const settings = getRuntime().getMiscSettings();
  const watermarkConfig = (settings.watermarkConfig ?? {}) as WaterMarkProps;

  if (!flags["show-watermark"]) {
    return;
  }

  const defaultProps: WaterMarkProps = {
    content: [
      ...(typeof watermarkConfig.content === "string"
        ? [watermarkConfig.content]
        : watermarkConfig.content ?? []),
      flags["show-developer-watermark"] && isDeveloper ? "Developer" : "",
      flags["show-user-watermark"] ? username : "",
    ].filter(Boolean),
    zIndex: 1001,
    width: 200,
    font: {
      fontSize: 28,
    },
    gap: [190, 190],
    ...omit(watermarkConfig, ["content"]),
  };
  if (brick) {
    brick.resolve(defaultProps);
  } else {
    loadBricksImperatively([WATEMARK_BRICKNAME], getBrickPackages()).then(
      () => {
        brick = document.createElement(WATEMARK_BRICKNAME) as any;

        brick.resolve(defaultProps);
      },
      (error: unknown) => {
        // eslint-disable-next-line no-console
        console.error("Load watermark service failed:", error);
      }
    );
  }
}
