import { cloneDeep, pick, sortBy } from "lodash";
import {
  loadScript,
  prefetchScript,
  getTemplateDepsOfStoryboard,
  getDllAndDepsOfStoryboard,
  asyncProcessStoryboard,
  scanBricksInBrickConf,
  scanRouteAliasInStoryboard,
  getDllAndDepsByResource,
  scanProcessorsInAny,
  CustomApiInfo,
} from "@next-core/brick-utils";
import i18next from "i18next";
import * as AuthSdk from "@next-sdk/auth-sdk";
import {
  BootstrapV2Api_bootstrapV2,
  BootstrapV2Api_getAppStoryboardV2,
} from "@next-sdk/api-gateway-sdk";
import { UserAdminApi_searchAllUsersInfo } from "@next-sdk/user-service-sdk";
import { ObjectMicroAppApi_getObjectMicroAppList } from "@next-sdk/micro-app-sdk";
import { InstanceApi_postSearch } from "@next-sdk/cmdb-sdk";
import {
  RuntimeApi_runtimeMicroAppStandalone,
  RuntimeApi_RuntimeMicroAppStandaloneResponseBody,
} from "@next-sdk/micro-app-standalone-sdk";
import type {
  MountPoints,
  BootstrapData,
  RuntimeBootstrapData,
  InterceptorParams,
  MicroApp,
  UserInfo,
  MagicBrickConfig,
  FeatureFlags,
  RuntimeStoryboard,
  BrickConf,
  LayoutType,
  PresetBricksConf,
  RouteConf,
  MenuRawData,
  Storyboard,
  SimpleFunction,
  RouteConfOfBricks,
  CustomTemplate,
} from "@next-core/brick-types";
import { authenticate, isLoggedIn } from "../auth";
import {
  Router,
  MenuBar,
  AppBar,
  BaseBar,
  registerCustomTemplate,
} from "./exports";
import { getHistory } from "../history";
import {
  RelatedApp,
  VisitedWorkspace,
  RecentApps,
  CustomApiDefinition,
  ThemeSetting,
} from "./interfaces";
import { processBootstrapResponse } from "./processors";
import { brickTemplateRegistry } from "./TemplateRegistries";
import { listenDevtools, listenDevtoolsEagerly } from "../internal/devtools";
import { registerCustomApi, CUSTOM_API_PROVIDER } from "../providers/CustomApi";
import { loadAllLazyBricks, loadLazyBricks } from "./LazyBrickRegistry";
import { isCustomApiProvider } from "./FlowApi";
import { getRuntime } from "../runtime";
import { initAnalytics } from "./initAnalytics";
import { standaloneBootstrap } from "./standaloneBootstrap";
import { getI18nNamespace } from "../i18n";
import {
  applyColorTheme,
  ColorThemeOptionsByBrand,
  ColorThemeOptionsByBaseColors,
  ColorThemeOptionsByVariables,
} from "../internal/applyColorTheme";
import { formDataProperties } from "./CustomForms/ExpandCustomForm";
import { formRenderer } from "./CustomForms/constants";
import { customTemplateRegistry } from "./CustomTemplates";
import { getRuntimeMisc } from "../internal/misc";

export class Kernel {
  public mountPoints: MountPoints;
  public bootstrapData: RuntimeBootstrapData;
  public presetBricks: PresetBricksConf;
  public menuBar: MenuBar;
  public appBar: AppBar;
  public loadingBar: BaseBar;
  public router: Router;
  public currentApp: MicroApp;
  public previousApp: MicroApp;
  public nextApp: MicroApp;
  public currentUrl: string;
  public currentRoute: RouteConf;
  public workspaceStack: VisitedWorkspace[] = [];
  public currentLayout: LayoutType;
  public allUserMapPromise: Promise<Map<string, UserInfo>> = Promise.resolve(
    new Map()
  );
  public allMagicBrickConfigMapPromise: Promise<Map<string, MagicBrickConfig>> =
    Promise.resolve(new Map());
  private allRelatedAppsPromise: Promise<RelatedApp[]> = Promise.resolve([]);
  public allMicroAppApiOrchestrationPromise: Promise<
    Map<string, CustomApiDefinition>
  > = Promise.resolve(new Map());
  private providerRepository = new Map<string, HTMLElement>();
  private loadUsersStarted = false;
  private loadMagicBrickConfigStarted = false;

  async bootstrap(mountPoints: MountPoints): Promise<void> {
    listenDevtoolsEagerly();
    this.mountPoints = mountPoints;
    if (
      getRuntimeMisc().isInIframeOfSameSite &&
      !getRuntimeMisc().isInIframeOfVisualBuilder
    ) {
      document.body.classList.add("bars-hidden-in-iframe");
    }

    await Promise.all([this.loadCheckLogin(), this.loadMicroApps()]);
    if (this.bootstrapData.storyboards.length === 0) {
      throw new Error("No storyboard were found.");
    }

    generateColorTheme(
      this.bootstrapData.settings?.misc?.theme as ThemeSetting
    );

    if (isLoggedIn()) {
      this.loadSharedData();
    }
    this.menuBar = new MenuBar(this, "menuBar");
    this.appBar = new AppBar(this, "appBar");
    this.loadingBar = new BaseBar(this, "loadingBar");
    this.router = new Router(this);

    initAnalytics();

    await this.router.bootstrap();
    if (!window.STANDALONE_MICRO_APPS) {
      this.legacyAuthGuard();
    }
    listenDevtools();
  }

  async layoutBootstrap(layout: LayoutType): Promise<void> {
    const supportedLayouts: LayoutType[] = ["console", "business"];
    if (!supportedLayouts.includes(layout)) {
      throw new Error(`Unknown layout: ${layout}`);
    }
    this.currentLayout = layout;

    this.presetBricks =
      layout === "business"
        ? {
            loadingBar: "business-website.loading-bar",
            pageNotFound: "business-website.page-not-found",
            pageError: "business-website.page-error",
          }
        : {
            ...this.bootstrapData.navbar,
            pageNotFound: "basic-bricks.page-not-found",
            pageError: "basic-bricks.page-error",
          };

    for (const item of supportedLayouts) {
      if (item === layout) {
        document.body.classList.add(`layout-${item}`);
      } else {
        document.body.classList.remove(`layout-${item}`);
      }
    }

    await Promise.all([
      this.menuBar.bootstrap(this.presetBricks.menuBar, {
        testid: "brick-next-menu-bar",
      }),
      this.appBar.bootstrap(this.presetBricks.appBar),
      this.loadingBar.bootstrap(this.presetBricks.loadingBar),
    ]);
  }

  private legacyAuthGuard(): void {
    // Listen messages from legacy Console-W,
    // Redirect to login page if received an `auth.guard` message.
    window.addEventListener("message", (event: MessageEvent): void => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const data = Object.assign({}, event.data);
      if (data.type === "auth.guard") {
        const history = getHistory();
        const ssoEnabled = this.getFeatureFlags()["sso-enabled"];
        history.push(ssoEnabled ? "/sso-auth/login" : "/auth/login", {
          from: history.location,
        });
      }
    });
  }

  private async loadCheckLogin(): Promise<void> {
    if (!window.NO_AUTH_GUARD) {
      const auth = await AuthSdk.checkLogin();
      if (auth.loggedIn) {
        authenticate(auth);
      }
    }
  }

  private async loadMicroApps(
    params?: { check_login?: boolean },
    interceptorParams?: InterceptorParams
  ): Promise<void> {
    const data = await (window.STANDALONE_MICRO_APPS
      ? standaloneBootstrap()
      : BootstrapV2Api_bootstrapV2(
          {
            appFields:
              "defaultConfig,userConfig,locales,name,homepage,id,currentVersion,installStatus,internal,status,icons",
            ignoreTemplateFields: "templates",
            ignoreBrickFields: "bricks,processors,providers,editors",
            ...params,
          },
          {
            interceptorParams,
          }
        ));
    const bootstrapResponse = {
      templatePackages: [],
      ...data,
    } as BootstrapData;
    // Merge `app.defaultConfig` and `app.userConfig` to `app.config`.
    processBootstrapResponse(bootstrapResponse);
    this.bootstrapData = {
      ...bootstrapResponse,
      microApps: bootstrapResponse.storyboards
        .map((storyboard) => storyboard.app)
        .filter(Boolean),
    };
  }

  reloadMicroApps(
    params?: { check_login?: boolean },
    interceptorParams?: InterceptorParams
  ): Promise<void> {
    // There is no need to reload standalone micro-apps.
    if (!window.STANDALONE_MICRO_APPS) {
      return this.loadMicroApps(params, interceptorParams);
    }
  }

  async fulfilStoryboard(storyboard: RuntimeStoryboard): Promise<void> {
    if (storyboard.$$fulfilled) {
      return;
    }
    if (!storyboard.$$fulfilling) {
      storyboard.$$fulfilling = this.doFulfilStoryboard(storyboard);
    }
    return storyboard.$$fulfilling;
  }

  private async doFulfilStoryboard(
    storyboard: RuntimeStoryboard
  ): Promise<void> {
    if (window.STANDALONE_MICRO_APPS) {
      Object.assign(storyboard, { $$fulfilled: true });
      if (!window.NO_AUTH_GUARD) {
        let appRuntimeData: RuntimeApi_RuntimeMicroAppStandaloneResponseBody;
        try {
          appRuntimeData = await RuntimeApi_runtimeMicroAppStandalone(
            storyboard.app.id
          );
        } catch (error) {
          // make it not crash when the backend service is not updated.
          // eslint-disable-next-line no-console
          console.warn(
            "request standalone runtime api from micro-app-standalone failed: ",
            error,
            ", something might went wrong running standalone micro app"
          );
        }
        if (appRuntimeData) {
          // merge user config
          storyboard.app.userConfig = {
            ...storyboard.app.userConfig,
            ...appRuntimeData.userConfig,
          };
          // get inject menus (Actually, appRuntimeData contains both main and inject menus)
          storyboard.meta = {
            ...storyboard.meta,
            injectMenus: appRuntimeData.injectMenus as MenuRawData[],
          };
        }
      }
    } else {
      const { routes, meta, app } = await BootstrapV2Api_getAppStoryboardV2(
        storyboard.app.id,
        {}
      );
      Object.assign(storyboard, {
        routes,
        meta,
        app: { ...storyboard.app, ...app },
        $$fulfilled: true,
      });
    }
    this.postProcessStoryboard(storyboard);
  }

  private postProcessStoryboard(storyboard: RuntimeStoryboard): void {
    storyboard.app.$$routeAliasMap = scanRouteAliasInStoryboard(storyboard);

    if (storyboard.meta?.i18n) {
      // Prefix to avoid conflict between brick package's i18n namespace.
      const i18nNamespace = getI18nNamespace("app", storyboard.app.id);
      // Support any language in `meta.i18n`.
      Object.entries(storyboard.meta.i18n).forEach(([lang, resources]) => {
        i18next.addResourceBundle(lang, i18nNamespace, resources);
      });
    }
  }

  _dev_only_updateStoryboard(
    appId: string,
    storyboardPatch: Partial<Storyboard>
  ): void {
    const storyboard = this.bootstrapData.storyboards.find(
      (item) => item.app.id === appId
    );
    Object.assign(storyboard, {
      ...storyboardPatch,
      $$fulfilling: Promise.resolve(),
      $$fulfilled: true,
      $$registerCustomTemplateProcessed: false,
      $$depsProcessed: false,
    });
    this.postProcessStoryboard(storyboard);
  }

  _dev_only_updateTemplatePreviewSettings(
    appId: string,
    templateId: string,
    settings?: unknown
  ): void {
    const { routes } = this.bootstrapData.storyboards.find(
      (item) => item.app.id === appId
    );
    const previewPath = `\${APP.homepage}/_dev_only_/template-preview/${templateId}`;
    const previewRouteIndex = routes.findIndex(
      (route) => route.path === previewPath
    );
    const newPreviewRoute: RouteConf = {
      path: previewPath,
      bricks: [
        {
          brick: templateId,
          ...pick(settings, "properties", "events", "lifeCycle", "context"),
        },
      ],
      menu: false,
      exact: true,
    };
    if (previewRouteIndex === -1) {
      routes.unshift(newPreviewRoute);
    } else {
      routes.splice(previewRouteIndex, 1, newPreviewRoute);
    }
  }

  _dev_only_updateSnippetPreviewSettings(
    appId: string,
    snippetData: {
      snippetId: string;
      bricks: BrickConf[];
    }
  ): void {
    const { routes } = this.bootstrapData.storyboards.find(
      (item) => item.app.id === appId
    );
    const previewPath = `\${APP.homepage}/_dev_only_/snippet-preview/${snippetData.snippetId}`;
    const previewRouteIndex = routes.findIndex(
      (route) => route.path === previewPath
    );
    const newPreviewRoute: RouteConf = {
      path: previewPath,
      bricks:
        snippetData.bricks?.length > 0
          ? snippetData.bricks
          : [{ brick: "span" }],
      menu: false,
      exact: true,
    };
    if (previewRouteIndex === -1) {
      routes.unshift(newPreviewRoute);
    } else {
      routes.splice(previewRouteIndex, 1, newPreviewRoute);
    }
  }

  _dev_only_updateStoryboardByRoute(appId: string, newRoute: RouteConf): void {
    const storyboard = this.bootstrapData.storyboards.find(
      (item) => item.app.id === appId
    );
    const replaceRoute = (routes: RouteConf[], key: string): RouteConf[] => {
      return routes.map((route) => {
        const routeKey = route.path;
        if (route.type === "routes") {
          route.routes = replaceRoute(route.routes, key);
          return route;
        } else if (routeKey === key) {
          return newRoute;
        } else {
          return route;
        }
      });
    };
    storyboard.routes = replaceRoute(storyboard.routes, newRoute.path);
  }

  _dev_only_updateStoryboardByTemplate(
    appId: string,
    newTemplate: CustomTemplate,
    settings: unknown
  ): void {
    const tplName = `${appId}.${newTemplate.name}`;
    customTemplateRegistry.delete(tplName);
    registerCustomTemplate(
      tplName,
      {
        bricks: newTemplate.bricks,
        proxy: newTemplate.proxy,
        state: newTemplate.state,
      },
      appId
    );
    this._dev_only_updateTemplatePreviewSettings(
      appId,
      newTemplate.name,
      settings
    );
  }

  _dev_only_updateStoryboardBySnippet(
    appId: string,
    newSnippet: {
      snippetId: string;
      bricks: BrickConf[];
    }
  ): void {
    this._dev_only_updateSnippetPreviewSettings(appId, newSnippet);
  }

  _dev_only_updateFormPreviewSettings(
    appId: string,
    formId: string,
    formData: formDataProperties
  ): void {
    const { routes } = this.bootstrapData.storyboards.find(
      (item) => item.app.id === appId
    );
    const previewPath = `\${APP.homepage}/_dev_only_/form-preview/${formId}`;
    const previewRouteIndex = routes.findIndex(
      (route) => route.path === previewPath
    );
    const newPreviewRoute: RouteConf = {
      path: previewPath,
      bricks: [
        {
          brick: formRenderer,
          properties: {
            formData: formData,
            isPreview: true,
          },
        },
      ],
      menu: false,
      exact: true,
    };
    if (previewRouteIndex === -1) {
      routes.unshift(newPreviewRoute);
    } else {
      routes.splice(previewRouteIndex, 1, newPreviewRoute);
    }
  }

  private _loadDepsOfStoryboard = async (
    storyboard: RuntimeStoryboard
  ): Promise<void> => {
    const { brickPackages, templatePackages } = this.bootstrapData;

    if (storyboard.dependsAll) {
      const dllPath = window.DLL_PATH || {};
      await loadScriptOfDll(Object.values(dllPath));
      await loadScriptOfBricksOrTemplates(
        brickPackages
          .map((item) => item.filePath)
          .concat(templatePackages.map((item) => item.filePath))
      );
      await loadAllLazyBricks();
    } else {
      // 先加载模板
      const templateDeps = getTemplateDepsOfStoryboard(
        storyboard,
        templatePackages
      );
      await loadScriptOfBricksOrTemplates(templateDeps);
      // 加载模板后才能加工得到最终的构件表
      const { dll, deps, bricks } = getDllAndDepsOfStoryboard(
        await asyncProcessStoryboard(
          storyboard,
          brickTemplateRegistry,
          templatePackages
        ),
        brickPackages,
        {
          ignoreBricksInUnusedCustomTemplates: true,
        }
      );
      await loadScriptOfDll(dll);
      await loadScriptOfBricksOrTemplates(deps);
      await loadLazyBricks(bricks);
    }
  };

  loadDepsOfStoryboard(storyboard: RuntimeStoryboard): Promise<void> {
    return this.gracefullyLoadDeps(this._loadDepsOfStoryboard, storyboard);
  }

  private async gracefullyLoadDeps<P extends unknown[]>(
    fn: SimpleFunction<P, Promise<void>>,
    ...args: P
  ): Promise<void> {
    try {
      await fn(...args);
    } catch (e) {
      if (e instanceof Event && e.target instanceof HTMLScriptElement) {
        // The scripts maybe stale when a user stays in page while upgrades been applied.
        // So we force reloading again automatically.
        // NOTE: reload only once to avoid a infinite loop.
        await this.reloadMicroApps();
        await fn(...args);
      } else {
        throw e;
      }
    }
  }

  prefetchDepsOfStoryboard(storyboard: RuntimeStoryboard): void {
    if (storyboard.$$depsProcessed) {
      return;
    }
    const { brickPackages, templatePackages } = this.bootstrapData;
    const templateDeps = getTemplateDepsOfStoryboard(
      storyboard,
      templatePackages
    );
    prefetchScript(templateDeps, window.PUBLIC_ROOT);
    const result = getDllAndDepsOfStoryboard(storyboard, brickPackages);
    prefetchScript(result.dll, window.CORE_ROOT);
    prefetchScript(result.deps, window.PUBLIC_ROOT);
    storyboard.$$depsProcessed = true;
  }

  registerCustomTemplatesInStoryboard(storyboard: RuntimeStoryboard): void {
    if (!storyboard.$$registerCustomTemplateProcessed) {
      // 注册自定义模板
      if (Array.isArray(storyboard.meta?.customTemplates)) {
        for (const tpl of storyboard.meta.customTemplates) {
          registerCustomTemplate(
            tpl.name,
            {
              bricks: tpl.bricks,
              proxy: tpl.proxy,
              state: tpl.state,
            },
            storyboard.app?.id
          );
        }
      }
      // 每个 storyboard 仅注册一次custom-template
      storyboard.$$registerCustomTemplateProcessed = true;
    }
  }

  async loadDynamicBricksInBrickConf(brickConf: BrickConf): Promise<void> {
    // Notice: `brickConf` contains runtime data,
    // which may contains recursive ref,
    // which could cause stack overflow while traversing.
    const bricks = scanBricksInBrickConf(brickConf);
    const processors = scanProcessorsInAny(brickConf);
    await this.loadDynamicBricks(bricks, processors);
  }

  private _loadDynamicBricks = async (
    bricks: string[],
    processors?: string[]
  ): Promise<void> => {
    const filteredBricks = bricks.filter(
      // Only try to load undefined custom elements.
      (item) => !customElements.get(item)
    );
    // Try to load deps for dynamic added bricks.
    const { dll, deps } = getDllAndDepsByResource(
      {
        bricks: filteredBricks,
        processors,
      },
      this.bootstrapData.brickPackages
    );
    await loadScriptOfDll(dll);
    await loadScriptOfBricksOrTemplates(deps);
    await loadLazyBricks(filteredBricks);
  };

  loadDynamicBricks(bricks: string[], processors?: string[]): Promise<void> {
    return this.gracefullyLoadDeps(this._loadDynamicBricks, bricks, processors);
  }

  private _loadEditorBricks = async (editorBricks: string[]): Promise<void> => {
    const { dll, deps } = getDllAndDepsByResource(
      {
        editorBricks: editorBricks.filter(
          // Only try to load undefined custom elements.
          (item) => !customElements.get(item)
        ),
      },
      this.bootstrapData.brickPackages
    );
    await loadScriptOfDll(dll);
    await loadScriptOfBricksOrTemplates(deps);
  };

  loadEditorBricks(editorBricks: string[]): Promise<void> {
    return this.gracefullyLoadDeps(this._loadEditorBricks, editorBricks);
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
    legacy,
  }: { appChanged?: boolean; legacy?: "iframe" } = {}): void {
    this.toggleBars(true);
    getRuntime().applyPageTitle(null);
    if (this.currentLayout !== "console") {
      // No bars should be unset for the business layout.
      return;
    }
    if (appChanged) {
      this.menuBar.resetAppMenu();
    }
    if (legacy !== "iframe" || appChanged) {
      // 对于 Legacy 页面，仅当切换应用时重设面包屑。
      this.appBar.setBreadcrumb(null);
    }
  }

  toggleLegacyIframe(visible: boolean): void {
    document.body.classList.toggle("show-legacy-iframe", visible);
  }

  loadSharedData(): void {
    if (!window.STANDALONE_MICRO_APPS) {
      this.loadRelatedAppsAsync();
    }
  }

  loadUsersAsync(): void {
    if (!this.loadUsersStarted) {
      this.loadUsersStarted = true;
      this.allUserMapPromise = this.loadUsers();
    }
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
        user_memo: true,
      };
      const allUserInfo = (
        await UserAdminApi_searchAllUsersInfo({
          query,
          fields,
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

  loadMicroAppApiOrchestrationAsync(usedCustomApis: CustomApiInfo[]): void {
    this.allMicroAppApiOrchestrationPromise =
      this.loadMicroAppApiOrchestration(usedCustomApis);
  }

  async getMicroAppApiOrchestrationMapAsync(): Promise<
    Map<string, CustomApiDefinition>
  > {
    return await this.allMicroAppApiOrchestrationPromise;
  }

  private async loadMicroAppApiOrchestration(
    usedCustomApis: CustomApiInfo[]
  ): Promise<Map<string, CustomApiDefinition>> {
    const allMicroAppApiOrchestrationMap: Map<string, CustomApiDefinition> =
      new Map();
    const legacyCustomApis = usedCustomApis.filter(
      (item) => !item.name.includes(":")
    );
    if (legacyCustomApis.length) {
      try {
        const allMicroAppApiOrchestration = (
          await InstanceApi_postSearch("MICRO_APP_API_ORCHESTRATION", {
            page: 1,
            page_size: legacyCustomApis.length,
            fields: {
              name: true,
              namespace: true,
              contract: true,
              config: true,
              type: true,
            },
            query: {
              $or: legacyCustomApis,
            },
          })
        ).list as CustomApiDefinition[];
        for (const api of allMicroAppApiOrchestration) {
          allMicroAppApiOrchestrationMap.set(
            `${api.namespace}@${api.name}`,
            api
          );
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Load legacy custom api error:", error);
      }
    }
    return allMicroAppApiOrchestrationMap;
  }

  loadMagicBrickConfigAsync(): void {
    if (!this.loadMagicBrickConfigStarted) {
      this.loadMagicBrickConfigStarted = true;
      this.allMagicBrickConfigMapPromise = this.loadMagicBrickConfig();
    }
  }

  private async loadMagicBrickConfig(): Promise<Map<string, MagicBrickConfig>> {
    const allMagicBrickConfigMap: Map<string, MagicBrickConfig> = new Map();
    try {
      const allMagicBrickConfig = (
        await InstanceApi_postSearch("_BRICK_MAGIC", {
          page: 1,
          // TODO(Lynette): 暂时设置3000，待后台提供全量接口
          page_size: 3000,
          fields: {
            "*": true,
          },
        })
      ).list as MagicBrickConfig[];
      for (const config of allMagicBrickConfig) {
        allMagicBrickConfigMap.set(config.selector, config);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Load magic brick config error:", error);
    }
    return allMagicBrickConfigMap;
  }

  private loadRelatedAppsAsync(): void {
    this.allRelatedAppsPromise = this.loadRelatedApps();
  }

  private async loadRelatedApps(): Promise<RelatedApp[]> {
    let relatedApps: RelatedApp[] = [];
    try {
      relatedApps = (await ObjectMicroAppApi_getObjectMicroAppList()).list;
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
    const thisApp = allRelatedApps.find((item) => item.microAppId === appId);
    if (!thisApp) {
      return [];
    }
    return sortBy(
      allRelatedApps.filter((item) => item.objectId === thisApp.objectId),
      ["order"]
    );
  }

  async updateWorkspaceStack(): Promise<void> {
    if (this.currentApp && this.currentApp.id) {
      const workspace: VisitedWorkspace = {
        appId: this.currentApp.id,
        appName: this.currentApp.name,
        appLocaleName: this.currentApp.localeName,
        url: this.currentUrl,
      };
      if (this.workspaceStack.length > 0) {
        const previousWorkspace =
          this.workspaceStack[this.workspaceStack.length - 1];
        const relatedApps = await this.getRelatedAppsAsync(
          previousWorkspace.appId
        );
        if (
          relatedApps.some((item) => item.microAppId === this.currentApp.id)
        ) {
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

  getRecentApps(): RecentApps {
    return {
      previousApp: this.previousApp,
      currentApp: this.currentApp,
      previousWorkspace: this.getPreviousWorkspace(),
    };
  }

  getFeatureFlags(): FeatureFlags {
    return Object.assign({}, this.bootstrapData?.settings?.featureFlags);
  }

  getStandaloneMenus(menuId: string, isPreFetch?: boolean): MenuRawData[] {
    const app = isPreFetch ? this.nextApp : this.currentApp;
    const currentAppId = app.id;
    const currentStoryboard = this.bootstrapData.storyboards.find(
      (storyboard) => storyboard.app.id === currentAppId
    );
    const menus = currentStoryboard.meta?.injectMenus
      ? cloneDeep(currentStoryboard.meta.injectMenus)
      : currentStoryboard.meta?.menus
      ? cloneDeep(currentStoryboard.meta.menus)
      : [];
    return menus
      .filter((menu) => menu.menuId === menuId)
      .map((menu) => ({
        ...menu,
        ...(menu.app?.length && menu.app[0].appId
          ? {}
          : { app: [{ appId: currentAppId }] }),
      }));
  }

  async getProviderBrick(provider: string): Promise<HTMLElement> {
    if (isCustomApiProvider(provider)) {
      provider = CUSTOM_API_PROVIDER;
    }

    if (this.providerRepository.has(provider)) {
      return this.providerRepository.get(provider);
    }

    if (provider === CUSTOM_API_PROVIDER && !customElements.get(provider)) {
      registerCustomApi();
    }

    await this.loadDynamicBricks([provider]);

    if (!customElements.get(provider)) {
      throw new Error(`Provider not defined: "${provider}".`);
    }
    const brick = document.createElement(provider);
    this.providerRepository.set(provider, brick);
    return brick;
  }
}

// Since `@next-dll/editor-bricks-helper` depends on `@next-dll/react-dnd`,
// always load react-dnd before loading editor-bricks-helper.
async function loadScriptOfDll(dlls: string[]): Promise<void> {
  if (dlls.some((dll) => dll.startsWith("dll-of-editor-bricks-helper."))) {
    const dllPath = window.DLL_PATH || {};
    await loadScript(dllPath["react-dnd"], window.CORE_ROOT);
  }
  // `loadScript` is auto cached, no need to filter out `react-dnd`.
  await loadScript(dlls, window.CORE_ROOT);
}

function loadScriptOfBricksOrTemplates(src: string[]): Promise<unknown> {
  return loadScript(src, window.PUBLIC_ROOT);
}

function generateColorTheme(theme: ThemeSetting): void {
  if (!theme) {
    return;
  } else if (theme.brandColor as ColorThemeOptionsByBrand) {
    applyColorTheme({
      type: "brandColor",
      ...theme.brandColor,
    });
  } else if (theme.baseColors as ColorThemeOptionsByBaseColors) {
    applyColorTheme({
      type: "baseColors",
      ...theme.baseColors,
    });
  } else if (theme.variables as ColorThemeOptionsByVariables) {
    applyColorTheme({
      type: "variables",
      ...theme.variables,
    });
  }
}
