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
import { getHistory } from "../history";

export class Kernel {
  public mountPoints: MountPoints;
  public bootstrapData: RuntimeBootstrapData;
  public menuBar: MenuBar;
  public appBar: AppBar;
  public loadingBar: LoadingBar;
  public router: Router;
  public currentApp: MicroApp;
  public nextApp: MicroApp;
  public allUserInfo: UserInfo[] = [];
  public allUserMap: Map<string, UserInfo> = new Map();

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
        this.allUserInfo = (
          await UserAdminApi.searchAllUsersInfo({
            query,
            fields
          })
        ).list as UserInfo[];
        for (const user of this.allUserInfo) {
          this.allUserMap.set(user.name, user);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("fetch all user error:", err);
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
    this.authGuard();
  }

  private authGuard(): void {
    // Listen messages from legacy Console-W,
    // Redirect to login page if received an `auth.guard` message.
    window.addEventListener("message", (event: MessageEvent): void => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const data = Object.assign({}, event.data);
      if (data.type === "auth.guard") {
        const history = getHistory();
        history.push("/auth/login", {
          from: history.location
        });
      }
    });
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
        .filter(Boolean)
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
