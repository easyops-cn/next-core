import { loadBricksImperatively } from "@next-core/loader";
import { getBrickPackages, getRuntime, hooks } from "./internal/Runtime.js";
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

export const WATEMARK_BRICKNAME = "basic.show-watermark";

export function setWatermark() {
  const flags = getRuntime().getFeatureFlags();
  const settings = getRuntime().getMiscSettings();
  if (!flags["show-watermark"]) {
    return;
  }
  const isDeveloper =
    window.APP_ROOT?.match(/versions\/([^/]+)\//)?.[1] === "0.0.0";
  const username =
    (hooks?.auth?.getAuth() as Record<string, any>)?.username ?? "";
  const watermarkConfig = (settings.watermarkConfig ?? {
    flags: {},
  }) as WaterMarkProps & {
    flags: {
      "show-development"?: boolean;
      "show-user"?: boolean;
    };
  };

  const defaultProps: WaterMarkProps = {
    content: [
      ...(typeof watermarkConfig.content === "string"
        ? [watermarkConfig.content]
        : watermarkConfig.content ?? []),
      watermarkConfig.flags?.["show-development"] && isDeveloper
        ? "Development"
        : "",
      watermarkConfig.flags?.["show-user"] ? username : "",
    ].filter(Boolean),
    zIndex: 1001,
    width: 200,
    font: {
      fontSize: 28,
    },
    gap: [190, 190],
    ...omit(watermarkConfig, ["content", "flags"]),
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
