import { createRuntime } from "@next-core/runtime";
import { http, HttpError, HttpResponse } from "@next-core/brick-http";
// import { loadScript, loadSharedModule } from "@next-core/loader";
import "./styles/default.css";

http.interceptors.response.use(
  function (response: HttpResponse) {
    return response.data;
  },
  function (error: HttpError) {
    return Promise.reject(error.error);
  }
);

const runtime = createRuntime();

runtime.bootstrap().then(
  () => {
    // eslint-disable-next-line no-console
    console.log("bootstrap ok");
  },
  (error) => {
    // eslint-disable-next-line no-console
    console.error("bootstrap failed:", error);
  }
);

// Promise.all([
//   loadScript("/bricks/basic/dist/index.bundle.js").then(() =>
//     Promise.all([
//       // loadSharedModule("bricks/basic", "./x-button"),
//       loadSharedModule("bricks/basic", "./y-button"),
//     ])
//   ),
//   loadScript("/bricks/form/dist/index.bundle.js").then(() =>
//     Promise.all([
//       loadSharedModule("bricks/form", "./f-input"),
//       loadSharedModule("bricks/form", "./f-select"),
//     ])
//   ),
// ]).then(
//   () => {
//     const main = document.querySelector("#main-mount-point") as HTMLElement;
//     main.innerHTML = `
//       <basic.x-button label="hello:">world</basic.x-button>
//       <basic.y-button label="你好:">世界</basic.y-button>
//       <form.f-input label="Name:"></form.f-input>
//       <form.f-select label="Gender:"></form.f-select>
//     `;

//     loadSharedModule("bricks/basic", "./processors/sayHello");
//   },
//   (err) => {
//     // eslint-disable-next-line no-console
//     console.error("load bricks failed:");
//     // eslint-disable-next-line no-console
//     console.error(err);
//   }
// );
