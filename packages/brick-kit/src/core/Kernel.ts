import { sortBy } from "lodash";
import * as AuthSdk from "@sdk/auth-sdk";
import { UserAdminApi } from "@sdk/user-service-sdk";
import { ObjectMicroAppApi } from "@sdk/micro-app-sdk";
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
import { RelatedApp, VisitedWorkspace } from "./interfaces";

export class Kernel {
  public mountPoints: MountPoints;
  public bootstrapData: RuntimeBootstrapData;
  public menuBar: MenuBar;
  public appBar: AppBar;
  public loadingBar: LoadingBar;
  public router: Router;
  public currentApp: MicroApp;
  public nextApp: MicroApp;
  public currentUrl: string;
  public workspaceStack: VisitedWorkspace[] = [];
  public allUserInfo: UserInfo[] = [];
  public allUserMap: Map<string, UserInfo> = new Map();

  private allRelatedApps: RelatedApp[] = [];

  async bootstrap(mountPoints: MountPoints): Promise<void> {
    this.mountPoints = mountPoints;
    await Promise.all([this.loadCheckLogin(), this.loadMicroApps()]);
    if (isLoggedIn()) {
      await this.loadSharedData();
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

  async loadSharedData(): Promise<void> {
    await Promise.all([this.loadUsers(), this.loadRelatedApps()]);
  }

  private async loadUsers(): Promise<void> {
    let newUserInfo: UserInfo[] = [];
    const newUserMap: Map<string, UserInfo> = new Map();
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
      newUserInfo = (
        await UserAdminApi.searchAllUsersInfo({
          query,
          fields
        })
      ).list as UserInfo[];
      for (const user of this.allUserInfo) {
        newUserMap.set(user.name, user);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Load users error:", error);
    }
    this.allUserInfo = newUserInfo;
    this.allUserMap = newUserMap;
  }

  private async loadRelatedApps(): Promise<void> {
    let newRelatedApps: RelatedApp[] = [];
    try {
      newRelatedApps = (await ObjectMicroAppApi.getObjectMicroAppList()).list;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Load related apps error:", error);
    }
    this.allRelatedApps = newRelatedApps;
  }

  getRelatedApps(appId: string): RelatedApp[] {
    if (!appId) {
      return [];
    }
    const thisApp = this.allRelatedApps.find(item => item.microAppId === appId);
    if (!thisApp) {
      return [];
    }
    return sortBy(
      this.allRelatedApps.filter(item => item.objectId === thisApp.objectId),
      ["order"]
    );
  }

  updateWorkspaceStack(): void {
    if (this.currentApp && this.currentApp.id) {
      const workspace: VisitedWorkspace = {
        appId: this.currentApp.id,
        appName: this.currentApp.name,
        url: this.currentUrl
      };
      if (this.workspaceStack.length > 0) {
        const previousWorkspace = this.workspaceStack[
          this.workspaceStack.length - 1
        ];
        const relatedApps = this.getRelatedApps(previousWorkspace.appId);
        if (relatedApps.some(item => item.microAppId === this.currentApp.id)) {
          Object.assign(previousWorkspace, workspace);
          return;
        }
      }

      const relatedApps = this.getRelatedApps(this.currentApp.id);
      if (relatedApps.length > 0) {
        this.workspaceStack.push(workspace);
        return;
      }
    }
    this.workspaceStack = [];
  }

  getPreviousWorkspace(): VisitedWorkspace {
    if (this.workspaceStack.length > 1) {
      return this.workspaceStack[this.workspaceStack.length - 2];
    }
  }

  popWorkspaceStack(): void {
    this.workspaceStack.pop();
  }
}
