export function createRuntime(container: HTMLElement): void {
  const main = document.createElement("div");
  const loadingBar = document.createElement("div");
  container.appendChild(main);
  container.appendChild(loadingBar);
}
