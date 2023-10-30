export function setUIVersion(version: string | undefined | null) {
  // 仅允许特定的 UI 版本
  let ui: string;
  switch (version) {
    case "8.2":
      ui = "v8-2";
      break;
    default:
      ui = "v8";
  }
  document.documentElement.dataset.ui = ui;
}
