import { sortBy, cloneDeep } from "lodash";
import * as AuthSdk from "@sdk/auth-sdk";
import { UserAdminApi } from "@sdk/user-service-sdk";
import { ObjectMicroAppApi } from "@sdk/micro-app-sdk";
import { InstanceApi } from "@sdk/cmdb-sdk";
import {
  MountPoints,
  BootstrapData,
  RuntimeBootstrapData,
  InterceptorParams,
  MicroApp,
  UserInfo,
  MagicBrickConfig
} from "@easyops/brick-types";
import { authenticate, isLoggedIn } from "../auth";
import { Router, MenuBar, AppBar, LoadingBar } from "./exports";
import { getHistory } from "../history";
import { RelatedApp, VisitedWorkspace } from "./interfaces";
import { mergeAppConfig } from "./processors";

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
  public allUserMapPromise: Promise<Map<string, UserInfo>> = Promise.resolve(
    new Map()
  );
  public allMagicBrickConfigMapPromise: Promise<
    Map<string, MagicBrickConfig>
  > = Promise.resolve(new Map());

  private allRelatedAppsPromise: Promise<RelatedApp[]> = Promise.resolve([]);

  async bootstrap(mountPoints: MountPoints): Promise<void> {
    this.mountPoints = mountPoints;
    await Promise.all([this.loadCheckLogin(), this.loadMicroApps()]);
    if (isLoggedIn()) {
      this.loadSharedData();
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
    // Merge `app.defaultConfig` and `app.userConfig` to `app.config`.
    mergeAppConfig(bootstrapResponse);
    this.bootstrapData = {
      ...bootstrapResponse,
      originalStoryboards: cloneDeep(bootstrapResponse.storyboards),
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

  loadSharedData(): void {
    this.loadUsersAsync();
    this.loadRelatedAppsAsync();
    if (
      this.bootstrapData.settings?.featureFlags?.["load-magic-brick-config"]
    ) {
      this.loadMagicBrickConfigAsync();
    }
  }

  private loadUsersAsync(): void {
    this.allUserMapPromise = this.loadUsers();
  }

  private async loadUsers(): Promise<Map<string, UserInfo>> {
    const allUserMap: Map<string, UserInfo> = new Map();
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
      const allUserInfo = (
        await UserAdminApi.searchAllUsersInfo({
          query,
          fields
        })
      ).list as UserInfo[];
      for (const user of allUserInfo) {
        allUserMap.set(user.name, user);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Load users error:", error);
    }
    return allUserMap;
  }

  private loadMagicBrickConfigAsync(): void {
    this.allMagicBrickConfigMapPromise = this.loadMagicBrickConfig();
  }

  private async loadMagicBrickConfig(): Promise<Map<string, MagicBrickConfig>> {
    const allMagicBrickConfiMap: Map<string, MagicBrickConfig> = new Map();
    try {
      const allMagicBrickConfig = (
        await InstanceApi.postSearch("MAGIC_BRICK", {
          page: 1,
          // TODO(Lynette): 暂时设置3000，待后台提供全量接口
          page_size: 3000,
          fields: {
            "*": true
          }
        })
      ).list as MagicBrickConfig[];
      for (const config of allMagicBrickConfig) {
        allMagicBrickConfiMap.set(config.selector, config);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Load magic brick config error:", error);
    }
    return allMagicBrickConfiMap;
  }

  private loadRelatedAppsAsync(): void {
    this.allRelatedAppsPromise = this.loadRelatedApps();
  }

  private async loadRelatedApps(): Promise<RelatedApp[]> {
    let relatedApps: RelatedApp[] = [];
    try {
      relatedApps = (await ObjectMicroAppApi.getObjectMicroAppList()).list;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Load related apps error:", error);
    }
    return relatedApps;
  }

  async getRelatedAppsAsync(appId: string): Promise<RelatedApp[]> {
    if (!appId) {
      return [];
    }
    const allRelatedApps = await this.allRelatedAppsPromise;
    const thisApp = allRelatedApps.find(item => item.microAppId === appId);
    if (!thisApp) {
      return [];
    }
    return sortBy(
      allRelatedApps.filter(item => item.objectId === thisApp.objectId),
      ["order"]
    );
  }

  async updateWorkspaceStack(): Promise<void> {
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
        const relatedApps = await this.getRelatedAppsAsync(
          previousWorkspace.appId
        );
        if (relatedApps.some(item => item.microAppId === this.currentApp.id)) {
          Object.assign(previousWorkspace, workspace);
          return;
        }
      }

      const relatedApps = await this.getRelatedAppsAsync(this.currentApp.id);
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
