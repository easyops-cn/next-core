import { library } from "@fortawesome/fontawesome-svg-core";
// import { fas } from "@fortawesome/free-solid-svg-icons";
// import { fab } from "@fortawesome/free-brands-svg-icons";

export function initializeLibrary(): void {
  // library.add(fas, fab);
}

const fas: Record<string, unknown> = {};
const fab: Record<string, unknown> = {};

export { fas, fab };
