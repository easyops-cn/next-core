import * as AuthSdk from "@sdk/auth-sdk";
import {
  MountPoints,
  BootstrapData,
  RuntimeBootstrapData,
  InterceptorParams,
  MicroApp
} from "@easyops/brick-types";
import { getDllAndDepsOfStoryboard } from "@easyops/brick-utils";
import { authenticate } from "../auth";
import { Router, MenuBar, AppBar, LoadingBar } from "./exports";

export class Kernel {
  public mountPoints: MountPoints;
  public bootstrapData: RuntimeBootstrapData;
  public menuBar: MenuBar;
  public appBar: AppBar;
  public loadingBar: LoadingBar;
  public router: Router;
  public currentApp: MicroApp;

  async bootstrap(mountPoints: MountPoints): Promise<void> {
    this.mountPoints = mountPoints;
    await Promise.all([this.loadCheckLogin(), this.loadMicroApps()]);
    this.menuBar = new MenuBar(this);
    this.appBar = new AppBar(this);
    this.loadingBar = new LoadingBar(this);
    this.router = new Router(this);
    await Promise.all([
      await this.menuBar.bootstrap(),
      await this.appBar.bootstrap(),
      await this.loadingBar.bootstrap()
    ]);
    // Router need those bars above to be ready.
    await this.router.bootstrap();
  }

  private async loadCheckLogin(): Promise<void> {
    const auth = await AuthSdk.checkLogin();
    if (auth.loggedIn) {
      authenticate(auth);
    }
  }

  async loadMicroApps(interceptorParams?: InterceptorParams): Promise<void> {
    const bootstrapResponse = await AuthSdk.bootstrap<BootstrapData>({
      interceptorParams
    });
    this.bootstrapData = {
      ...bootstrapResponse,
      storyboards: bootstrapResponse.storyboards.map(storyboard => ({
        ...storyboard,
        ...getDllAndDepsOfStoryboard(
          storyboard,
          bootstrapResponse.brickPackages
        )
      })),
      microApps: bootstrapResponse.storyboards
        .map(storyboard => storyboard.app)
        .filter(app => app && !app.internal)
    };
  }

  firstRendered(): void {
    setTimeout(() => {
      document.body.classList.add("first-rendered");
    });
  }

  /**
   * 展开/收起顶栏、侧栏
   * @param visible 是否显示
   */
  toggleBars(visible: boolean): void {
    document.body.classList.toggle("bars-hidden", !visible);
  }

  /**
   * 重置顶栏、侧栏
   */
  unsetBars(): void {
    this.toggleBars(true);
    this.menuBar.setAppMenu(null);
    this.appBar.setPageTitle(null);
    this.appBar.setBreadcrumb(null);
  }

  toggleLegacyIframe(visible: boolean): void {
    document.body.classList.toggle("show-legacy-iframe", visible);
  }
}
