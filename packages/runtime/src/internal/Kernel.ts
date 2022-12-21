import { BootstrapData, BrickPackage } from "@next-core/brick-types";
import { loadScript, loadSharedModule } from "@next-core/loader";
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

    // When loading bundles with webpack module federation concurrently, if
    // these bundles share some modules, webpack will load a singleton module
    // if versions are matched. Webpack will use the first bundle who started
    // to init the shared scope. Generally which bundle to use for a specific
    // module, does not matter. However, it may cause flaky result since the
    // shared module may from different bundles which maybe not exactly the
    // same, especially developers declare dependencies incorrectly sometimes.
    // So in order to make it less flaky, we try to make a BASIC package takes
    // precedence over others. We will always load the shared modules it has,
    // from the basic package bundle.
    let foundBasicPkg: BrickPackage | undefined;
    const restPackages: BrickPackage[] = [];
    for (const pkg of bootstrapData.brickPackages) {
      if (pkg.id === "bricks/basic") {
        foundBasicPkg = pkg;
      } else {
        restPackages.push(pkg);
      }
    }
    let waitBasicPkg: Promise<unknown> | undefined;
    let basicPkgPromise: Promise<unknown> | undefined;
    const basicPkg = foundBasicPkg;
    if (basicPkg) {
      const tempPromise = loadScript(basicPkg.filePath);
      // Packages other than BASIC will wait for an extra micro-task tick.
      waitBasicPkg = tempPromise.then(() => Promise.resolve());
      basicPkgPromise = tempPromise.then(() =>
        basicPkg.bricks.map((brick) => {
          const [namespace, brickName] = brick.split(".");
          return loadSharedModule(`bricks/${namespace}`, `./${brickName}`);
        })
      );
    }

    const pkgPromises = [basicPkgPromise].concat(
      restPackages.map(async (pkg) => {
        await loadScript(pkg.filePath);
        if (waitBasicPkg) {
          await waitBasicPkg;
        }
        return Promise.all(
          pkg.bricks.map((brick) => {
            const [namespace, brickName] = brick.split(".");
            return loadSharedModule(`bricks/${namespace}`, `./${brickName}`);
          })
        );
      })
    );

    Promise.all(pkgPromises).then(
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
