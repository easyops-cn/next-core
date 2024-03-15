import { loadBricksImperatively } from "@next-core/loader";
import { omit } from "lodash";
import { getRuntime } from "../runtime";
import { getAuth } from "../auth";

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

export function setWatermark(): void {
  const flags = getRuntime().getFeatureFlags();
  const settings = getRuntime().getMiscSettings();
  const brickPackages = getRuntime().getBrickPackages();

  if (!flags["show-watermark"]) {
    return;
  }

  const watermarkConfig = (settings.watermarkConfig ?? {
    flags: {},
  }) as WaterMarkProps & {
    flags: {
      "show-development"?: boolean;
      "show-user"?: boolean;
    };
  };
  const isDeveloper =
    window.APP_ROOT?.match(/versions\/([^/]+)\//)?.[1] === "0.0.0";
  const username = getAuth()?.username ?? "";

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
    loadBricksImperatively([WATEMARK_BRICKNAME], brickPackages as any).then(
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
