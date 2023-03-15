import { createProviderClass } from "@next-core/utils/storyboard";

async function getEasyopsIcons(): Promise<Record<string, string[]>> {
  return (await import("../easyops-icon/generated/icons.json")).default;
}

async function getFaIcons(): Promise<Record<string, string[]>> {
  return (await import("../fa-icon/generated/icons.json")).default;
}

customElements.define(
  "icons.get-easyops-icons",
  createProviderClass(getEasyopsIcons)
);

customElements.define("icons.get-fa-icons", createProviderClass(getFaIcons));
