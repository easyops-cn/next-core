import { loadBrick } from "./loadBrick.js";
import { loadScript } from "./loadScript.js";
import "./styles/default.css";

// eslint-disable-next-line no-console
console.log("hello, world");

loadScript("/bricks/basic/dist/index.bundle.js")
  .then(() =>
    Promise.all([
      loadBrick("bricks/basic", "./x-button"),
      loadBrick("bricks/basic", "./y-button"),
    ])
  )
  .then(
    () => {
      const main = document.querySelector("#main-mount-point") as HTMLElement;
      main.innerHTML = `
      <x-button label="hello:">world</x-button>
    `;
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.error("load bricks failed:");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  );
