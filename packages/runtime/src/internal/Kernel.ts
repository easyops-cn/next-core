import { BootstrapData } from "@next-core/brick-types";
import { stableLoadBricks } from "@next-core/loader";
import { loadCheckLogin } from "./loadCheckLogin.js";
import { loadBootstrapData } from "./loadBootstrapData.js";
import { Router } from "./Router.js";

export class Kernel {
  public bootstrapData: BootstrapData | undefined;

  #router: Router | undefined;

  async bootstrap(): Promise<void> {
    const [, bootstrapData] = await Promise.all([
      loadCheckLogin(),
      loadBootstrapData(),
    ]);
    this.bootstrapData = bootstrapData;
    this.#router = new Router(this);
    await this.#router.bootstrap();
    document.body.classList.add("first-rendered");

    stableLoadBricks(
      ["basic.x-button", "basic.y-button", "form.f-input", "form.f-select"],
      bootstrapData.brickPackages
    ).then(
      () => {
        const main = document.querySelector("#main-mount-point") as HTMLElement;
        const div = document.createElement("div");
        div.innerHTML = `
          <basic.x-button label="hello:">world</basic.x-button>
          <basic.y-button label="你好:">世界</basic.y-button>
          <form.f-input label="Name:"></form.f-input>
          <form.f-select label="Gender:"></form.f-select>
        `;
        // // const xButton = document.createElement("basic.y-button");
        // // console.log("before set attr");
        // xButton.setAttribute("label", "Hello:");
        // // console.log("after set attr");
        // // (xButton as any).label = "Hello:";
        // div.appendChild(xButton);
        // console.log("before connect");
        main.appendChild(div);
        // console.log("after connect");

        // loadSharedModule("bricks/basic", "./processors/sayHello");
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error("load bricks failed:");
        // eslint-disable-next-line no-console
        console.error(err);
      }
    );
  }
}
