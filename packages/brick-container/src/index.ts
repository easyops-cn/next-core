import { loadBrick } from "./loadBrick.js";
import { loadScript } from "./loadScript.js";
import "./styles/default.css";

Promise.all([
  loadScript("/bricks/basic/dist/index.bundle.js").then(() =>
    Promise.all([
      loadBrick("bricks/basic", "./x-button"),
      loadBrick("bricks/basic", "./y-button"),
    ])
  ),
  loadScript("/bricks/form/dist/index.bundle.js").then(() =>
    Promise.all([
      loadBrick("bricks/form", "./f-input"),
      loadBrick("bricks/form", "./f-select"),
    ])
  ),
]).then(
  () => {
    const main = document.querySelector("#main-mount-point") as HTMLElement;
    main.innerHTML = `
      <x-button label="hello:">world</x-button>
      <y-button label="你好:">世界</y-button>
      <f-input label="Name:"></f-input>
      <f-select label="Gender:"></f-select>
    `;
  },
  (err) => {
    // eslint-disable-next-line no-console
    console.error("load bricks failed:");
    // eslint-disable-next-line no-console
    console.error(err);
  }
);
