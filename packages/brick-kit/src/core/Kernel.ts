import { cloneDeep, merge, pick } from "lodash";
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
  deepFreeze,
} from "@next-core/brick-utils";
import i18next from "i18next";
import * as AuthSdk from "@next-sdk/auth-sdk";
import {
  BootstrapV2Api_bootstrapV2,
  BootstrapV2Api_getAppStoryboardV2,
} from "@next-sdk/api-gateway-sdk";
import { UserAdminApi_searchAllUsersInfo } from "@next-sdk/user-service-sdk";
import { InstalledMicroAppApi_getI18NData } from "@next-sdk/micro-app-sdk";
import { InstanceApi_postSearch } from "@next-sdk/cmdb-sdk";
import { RuntimeApi_RuntimeMicroAppStandaloneResponseBody } from "@next-sdk/micro-app-standalone-sdk";
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
  CustomTemplate,
  MetaI18n,
} from "@next-core/brick-types";
import {
  loadBricksImperatively,
  loadProcessorsImperatively,
} from "@next-core/loader";
import { authenticate } from "../auth";
import {
  Router,
  MenuBar,
  AppBar,
  BaseBar,
  registerCustomTemplate,
} from "./exports";
import { getHistory } from "../history";
import { RecentApps, CustomApiDefinition, ThemeSetting } from "./interfaces";
import { processBootstrapResponse } from "./processors";
import { brickTemplateRegistry } from "./TemplateRegistries";
import { listenDevtools, listenDevtoolsEagerly } from "../internal/devtools";
import { registerCustomApi, CUSTOM_API_PROVIDER } from "../providers/CustomApi";
import { loadAllLazyBricks, loadLazyBricks } from "./LazyBrickRegistry";
import { isCustomApiProvider } from "./FlowApi";
import { getRuntime } from "../runtime";
import { initAnalytics } from "./initAnalytics";
import {
  safeGetRuntimeMicroAppStandalone,
  standaloneBootstrap,
} from "./standaloneBootstrap";
import { getPreviewBootstrap } from "./previewBootstrap";
import { getI18nNamespace } from "../i18n";
import {
  applyColorTheme,
  ColorThemeOptionsByBrand,
  ColorThemeOptionsByBaseColors,
  ColorThemeOptionsByVariables,
} from "../internal/applyColorTheme";
import { FormDataProperties } from "./CustomForms/ExpandCustomForm";
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
  public currentRoute: RouteConf;
  public currentLayout: LayoutType;
  public allUserMapPromise: Promise<Map<string, UserInfo>> = Promise.resolve(
    new Map()
  );
  public allMagicBrickConfigMapPromise: Promise<Map<string, MagicBrickConfig>> =
    Promise.resolve(new Map());
  private originFaviconHref: string;
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
    if (
      this.bootstrapData.storyboards.length === 0 &&
      !window.DEVELOPER_PREVIEW
    ) {
      throw new Error("No storyboard were found.");
    }

    generateColorTheme(
      this.bootstrapData.settings?.misc?.theme as ThemeSetting
    );

    this.menuBar = new MenuBar(this, "menuBar");
    this.appBar = new AppBar(this, "appBar");
    this.loadingBar = new BaseBar(this, "loadingBar");
    this.router = new Router(this);

    initAnalytics();

    this.originFaviconHref = (
      document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement
    )?.href;

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
            pageNotFound: "presentational-bricks.brick-result",
            pageError: "presentational-bricks.brick-result",
          }
        : {
            ...this.bootstrapData.navbar,
            pageNotFound: "presentational-bricks.brick-result",
            pageError: "presentational-bricks.brick-result",
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
    // istanbul ignore if
    if (window.DEVELOPER_PREVIEW) {
      this.bootstrapData = await getPreviewBootstrap();
      return;
    }

    const data = await (window.STANDALONE_MICRO_APPS
      ? standaloneBootstrap()
      : BootstrapV2Api_bootstrapV2(
          {
            appFields:
              "defaultConfig,userConfig,locales,name,homepage,id,currentVersion,installStatus,internal,status,icons,standaloneMode",
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
    // Merge `app.defaultConfig` and `app.userConfig` to `app.config`. Should merge config again in standalone mode when doFulfilStoryboard because static bootstrap.json do not have userConfig.
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
    } else {
      // load launchpad info
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
      Object.assign(storyboard, {
        $$fulfilled: true,
        $$fulfilling: null,
      });
      if (!window.NO_AUTH_GUARD) {
        let appRuntimeData: RuntimeApi_RuntimeMicroAppStandaloneResponseBody | void;
        try {
          // Note: the request maybe have fired already during bootstrap.
          appRuntimeData = await safeGetRuntimeMicroAppStandalone(
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
          // Merge `app.defaultConfig` and `app.userConfig` to `app.config`.
          storyboard.app.userConfig = {
            ...storyboard.app.userConfig,
            ...appRuntimeData.userConfig,
          };
          storyboard.app.config = deepFreeze(
            merge({}, storyboard.app.defaultConfig, storyboard.app.userConfig)
          );
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
        $$fulfilling: null,
      });
    }
    this.postProcessStoryboard(storyboard);
  }

  private postProcessStoryboard(storyboard: RuntimeStoryboard): void {
    storyboard.app.$$routeAliasMap = scanRouteAliasInStoryboard(storyboard);
    this.postProcessStoryboardI18n(storyboard);
  }

  private postProcessStoryboardI18n(storyboard: RuntimeStoryboard): void {
    if (storyboard.meta?.i18n) {
      // Prefix to avoid conflict between brick package's i18n namespace.
      const i18nNamespace = getI18nNamespace("app", storyboard.app.id);
      // Support any language in `meta.i18n`.
      Object.entries(storyboard.meta.i18n).forEach(([lang, resources]) => {
        i18next.addResourceBundle(lang, i18nNamespace, resources);
      });
    }
  }

  async fulfilStoryboardI18n(appIds: string[]): Promise<void> {
    // Ignore already fulfilled apps.
    const filteredStoryboards = appIds
      .map((appId) =>
        this.bootstrapData.storyboards.find((story) => story.app.id === appId)
      )
      .filter((story) => story && !story.$$fulfilled && !story.$$i18nFulfilled);

    if (window.STANDALONE_MICRO_APPS) {
      // standalone micros-apps not need to request i18n
      return;
    }

    // Do not fulfil i18n if the app is doing a whole fulfilling.
    const fulfilling: Promise<void>[] = [];
    const filteredAppIds: string[] = [];
    for (const story of filteredStoryboards) {
      if (story.$$fulfilling) {
        fulfilling.push(story.$$fulfilling);
      } else {
        filteredAppIds.push(story.app.id);
      }
    }

    if (filteredAppIds.length === 0) {
      // Still wait for these whole fulfilling.
      await Promise.all(fulfilling);
      return;
    }

    const [{ i18nInfo }] = await Promise.all([
      InstalledMicroAppApi_getI18NData({
        appIds: filteredAppIds.join(","),
      }),
      // Still wait for these whole fulfilling.
      ...fulfilling,
    ]);

    for (const { appId, i18n } of i18nInfo) {
      const storyboard = this.bootstrapData.storyboards.find(
        (story) => story.app.id === appId
      );
      Object.assign(storyboard, {
        meta: {
          ...storyboard.meta,
          i18n: i18n as MetaI18n,
        },
        $$i18nFulfilled: true,
      });
      this.postProcessStoryboardI18n(storyboard);
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
      $$fulfilling: null,
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
    const { routes, app } = this.bootstrapData.storyboards.find(
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
      hybrid: app.legacy === "iframe",
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
    const { routes, app } = this.bootstrapData.storyboards.find(
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
      hybrid: app.legacy === "iframe",
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
    let match = false;
    const getKey = (route: RouteConf): string => `${route.path}.${route.exact}`;
    const replaceRoute = (routes: RouteConf[], key: string): RouteConf[] => {
      return routes.map((route) => {
        const routeKey = getKey(route);
        if (route.type === "routes") {
          route.routes = replaceRoute(route.routes, key);
          return route;
        } else if (routeKey === key) {
          match = true;
          return newRoute;
        } else {
          return route;
        }
      });
    };
    storyboard.routes = replaceRoute(storyboard.routes, getKey(newRoute));
    if (!match) {
      storyboard.routes.unshift(newRoute);
    }
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
    formData: FormDataProperties
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
  ): Promise<{ pendingTask: Promise<void> }> => {
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
      return {
        pendingTask: Promise.resolve(),
      };
    } else {
      // 先加载模板
      const templateDeps = getTemplateDepsOfStoryboard(
        storyboard,
        templatePackages
      );
      await loadScriptOfBricksOrTemplates(templateDeps);
      // 加载模板后才能加工得到最终的构件表
      const { dll, deps, bricks, v3Bricks, v3Processors, eager } =
        getDllAndDepsOfStoryboard(
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
      // 需要先阻塞加载 Custom Processors 和 widgets。
      await loadScriptOfDll(eager.dll);
      await loadScriptOfBricksOrTemplates(eager.deps);
      if (eager.v3Bricks?.length) {
        await loadBricksImperatively(eager.v3Bricks, brickPackages as any);
      }
      // 加载构件资源时，不再阻塞后续业务数据的加载，在挂载构件时再等待该任务完成。
      // 挂载构件可能包括：Provider 构件实时挂载、路由准备完成后的统一挂载等。
      return {
        pendingTask: loadScriptOfDll(dll)
          .then(() => loadScriptOfBricksOrTemplates(deps))
          .then(async () => {
            await Promise.all([
              loadLazyBricks(bricks),
              v3Bricks?.length &&
                loadBricksImperatively(v3Bricks, brickPackages as any),
              v3Processors?.length &&
                loadProcessorsImperatively(v3Processors, brickPackages as any),
            ]);
          }),
      };
    }
  };

  loadDepsOfStoryboard(
    storyboard: RuntimeStoryboard
  ): Promise<{ pendingTask: Promise<void> }> {
    return this.gracefullyLoadDeps(this._loadDepsOfStoryboard, storyboard);
  }

  private async gracefullyLoadDeps<P extends unknown[], R>(
    fn: SimpleFunction<P, Promise<R>>,
    ...args: P
  ): Promise<R> {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof Event && e.target instanceof HTMLScriptElement) {
        // The scripts maybe stale when a user stays in page while upgrades been applied.
        // So we force reloading again automatically.
        // NOTE: reload only once to avoid a infinite loop.
        await this.reloadMicroApps();
        return await fn(...args);
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
            storyboard.app?.id,
            true
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

  async loadResourceOfTemplate(tplTagName: string): Promise<void> {
    const template = customTemplateRegistry.get(tplTagName);
    const processors = scanProcessorsInAny([template.state, template.bricks]);
    await this.loadDynamicBricks([], processors);
  }

  private _loadDynamicBricks = async (
    bricks: string[],
    processors?: string[]
  ): Promise<void> => {
    const filteredBricks = bricks.filter(
      // Only try to load undefined custom elements.
      (item) => !customElements.get(item)
    );
    const { brickPackages } = this.bootstrapData;
    // Try to load deps for dynamic added bricks.
    const { dll, deps, v3Bricks, v3Processors } = getDllAndDepsByResource(
      {
        bricks: filteredBricks,
        processors,
      },
      this.bootstrapData.brickPackages
    );
    await loadScriptOfDll(dll);
    await loadScriptOfBricksOrTemplates(deps);
    await Promise.all([
      loadLazyBricks(filteredBricks),
      v3Bricks?.length &&
        loadBricksImperatively(v3Bricks, brickPackages as any),
      v3Processors?.length &&
        loadProcessorsImperatively(v3Processors, brickPackages as any),
    ]);
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

  getRecentApps(): RecentApps {
    return {
      previousApp: this.previousApp,
      currentApp: this.currentApp,
    };
  }

  getFeatureFlags(): FeatureFlags {
    return Object.assign(
      {},
      this.bootstrapData?.settings?.featureFlags,
      (this.nextApp?.config?.settings as any)?.featureFlags
    );
  }

  async getStandaloneMenus(
    menuId: string,
    isPreFetch?: boolean
  ): Promise<MenuRawData[]> {
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

    let filterMenus = menus
      .filter((menu) => menu.menuId === menuId)
      .map((menu) => ({
        ...menu,
        ...(menu.app?.length && menu.app[0].appId
          ? {}
          : { app: [{ appId: currentAppId }] }),
      }));

    if (!filterMenus.length) {
      filterMenus =
        ((
          await InstanceApi_postSearch("STANDALONE_MENU@EASYOPS", {
            page: 1,
            page_size: 200,
            fields: {
              menuId: true,
              title: true,
              icon: true,
              link: true,
              titleDataSource: true,
              defaultCollapsed: true,
              defaultCollapsedBreakpoint: true,
              type: true,
              injectMenuGroupId: true,
              dynamicItems: true,
              itemsResolve: true,
              items: true,
              i18n: true,
              overrideApp: true,
              "items.children": true,
              "app.appId": true,
            },
            query: {
              menuId: {
                $eq: menuId,
              },
              "app.isActiveVersion": {
                $eq: true,
              },
            },
          })
        )?.list as MenuRawData[]) ?? [];
    }

    return filterMenus as MenuRawData[];
  }

  setOriginFaviconHref(href: string): void {
    this.originFaviconHref = href;
  }

  getOriginFaviconHref(): string {
    return this.originFaviconHref;
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
