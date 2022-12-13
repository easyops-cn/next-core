import { createBrowserHistory, type History } from "history";

let history: History;

export function createHistory(): History {
  history = createBrowserHistory({
    // basename: getBasePath().replace(/\/$/, ""),
    basename: "",
  });
  return history;
}

export function getHistory(): History {
  return history;
}
