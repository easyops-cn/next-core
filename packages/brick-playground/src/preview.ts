import { stableLoadBricks } from "@next-core/loader";
import "./preview.css";

(window as any)._preview_only_stableLoadBricks = (
  ...args: Parameters<typeof stableLoadBricks>
) => stableLoadBricks(...args);
