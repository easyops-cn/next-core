import { createHistory } from "./internal/history.js";

export function createRuntime(container: HTMLElement): void {
  createHistory;
  const main = document.createElement("div");
  const loadingBar = document.createElement("div");
  container.appendChild(main);
  container.appendChild(loadingBar);
}
