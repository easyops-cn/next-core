import * as AuthSdk from "@sdk/auth-sdk";
import { UserAdminApi } from "@sdk/user-service-sdk";
import {
  MountPoints,
  BootstrapData,
  RuntimeBootstrapData,
  InterceptorParams,
  MicroApp,
  UserInfo
} from "@easyops/brick-types";
import { authenticate, isLoggedIn } from "../auth";
import { Router, MenuBar, AppBar, LoadingBar } from "./exports";

export class Kernel {
  public mountPoints: MountPoints;
  public bootstrapData: RuntimeBootstrapData;
  public menuBar: MenuBar;
  public appBar: AppBar;
  public loadingBar: LoadingBar;
  public router: Router;
  public currentApp: MicroApp;
  public allUserInfo: UserInfo[] = [];

  async bootstrap(mountPoints: MountPoints): Promise<void> {
    this.mountPoints = mountPoints;
    await Promise.all([this.loadCheckLogin(), this.loadMicroApps()]);
    if (isLoggedIn()) {
      try {
        const query = { state: "valid" };
        const fields = {
          name: true,
          nickname: true,
          user_email: true,
          user_tel: true,
          user_icon: true,
          user_memo: true
        };
        this.allUserInfo = (await UserAdminApi.searchAllUsersInfo({
          query,
          fields
        })).list as UserInfo[];
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("fetch all user error:", err);
        this.allUserInfo = [];
      }
    }
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

  async loadMicroApps(
    params?: { check_login?: boolean },
    interceptorParams?: InterceptorParams
  ): Promise<void> {
    const bootstrapResponse = Object.assign(
      {
        templatePackages: []
      },
      await AuthSdk.bootstrap<BootstrapData>(params, {
        interceptorParams
      })
    );
    this.bootstrapData = {
      ...bootstrapResponse,
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
  unsetBars({
    appChanged,
    legacy
  }: { appChanged?: boolean; legacy?: "iframe" } = {}): void {
    this.toggleBars(true);
    if (appChanged) {
      this.menuBar.setAppMenu(null);
    }
    if (legacy !== "iframe" || appChanged) {
      // 对于 Legacy 页面，仅当切换应用时重设面包屑。
      this.appBar.setBreadcrumb(null);
    }
    this.appBar.setPageTitle(null);
  }

  toggleLegacyIframe(visible: boolean): void {
    document.body.classList.toggle("show-legacy-iframe", visible);
  }
}
