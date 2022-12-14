import loadScript from "@next-core/loader/loadScript";
import loadSharedModule from "@next-core/loader/loadSharedModule";
import "./styles/default.css";

Promise.all([
  loadScript("/bricks/basic/dist/index.bundle.js").then(() =>
    Promise.all([
      // loadSharedModule("bricks/basic", "./x-button"),
      loadSharedModule("bricks/basic", "./y-button"),
    ])
  ),
  loadScript("/bricks/form/dist/index.bundle.js").then(() =>
    Promise.all([
      loadSharedModule("bricks/form", "./f-input"),
      loadSharedModule("bricks/form", "./f-select"),
    ])
  ),
]).then(
  () => {
    const main = document.querySelector("#main-mount-point") as HTMLElement;
    main.innerHTML = `
      <basic.x-button label="hello:">world</basic.x-button>
      <basic.y-button label="你好:">世界</basic.y-button>
      <form.f-input label="Name:"></form.f-input>
      <form.f-select label="Gender:"></form.f-select>
    `;

    loadSharedModule("bricks/basic", "./processors/sayHello");
  },
  (err) => {
    // eslint-disable-next-line no-console
    console.error("load bricks failed:");
    // eslint-disable-next-line no-console
    console.error(err);
  }
);
