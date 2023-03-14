import { loadScript, loadBricksImperatively } from "@next-core/loader";
import { createProviderClass } from "@next-core/utils/storyboard";
import {
  authenticate,
  getAuth,
  isLoggedIn,
  logout,
  getCssPropertyValue,
  getCurrentTheme,
  getCurrentMode,
  batchSetAppsLocalTheme,
  applyTheme,
  getHistory,
  handleHttpError,
  httpErrorToString,
  checkIfByTransform,
  checkIfOfComputed,
  StoryboardFunctionRegistryFactory,
} from "@next-core/runtime";
import { i18n, i18nText } from "@next-core/i18n";
import * as Http from "@next-core/http";
import type { BrickPackage, SiteTheme } from "@next-core/types";
import * as History from "history";
import * as JsYaml from "js-yaml";
import lodash from "lodash";
import moment from "moment";
import "@next-core/theme";
import type { EasyOpsIconProps } from "@next-bricks/icons/easyops-icon";
import { getLegacyUseBrick } from "./legacy-brick-kit/getLegacyUseBrick.js";
import { getLegacyRuntime } from "./legacy-brick-kit/getLegacyRuntime.js";
import { loadLazyBricks } from "./legacy-brick-kit/LazyBrickRegistry.js";
import { getLegacyUseFeatureFlags } from "./legacy-brick-kit/getLegacyUseFeatureFlags.js";
import { getLegacyErrorBoundary } from "./legacy-brick-kit/getLegacyErrorBoundary.js";
import { getLegacyUseRecentApps } from "./legacy-brick-kit/getLegacyUseRecentApps.js";
import { getLegacyUseProvider } from "./legacy-brick-kit/getLegacyUseProvider.js";

// eslint-disable-next-line
// @ts-ignore
window.DLL_PATH = DLL_PATH;

const dllPromises = new Map<string, Promise<void>>();

interface DLL {
  (moduleId: string): any;
}

const MAIN_KEY = "";
const ICONS_KEY = "_icons";
const ICONS_BRICK = "icons.easyops-icon";

export async function loadBricks(
  adapterPkgFilePath: string,
  brickPkgFilePath: string,
  bricks: string[],
  dlls: string[] | undefined,
  brickPackages: BrickPackage[]
) {
  let iconsPromise = dllPromises.get(ICONS_KEY);
  if (!iconsPromise) {
    // Load the icon brick, but do not wait for it.
    iconsPromise = loadBricksImperatively([ICONS_BRICK], brickPackages);
    dllPromises.set(ICONS_KEY, iconsPromise);
  }
  let mainPromise = dllPromises.get(MAIN_KEY);
  if (!mainPromise) {
    mainPromise = loadMainDll(adapterPkgFilePath);
    dllPromises.set(MAIN_KEY, mainPromise);
  }
  await mainPromise;
  await loadDlls(adapterPkgFilePath, dlls);
  await loadScript(brickPkgFilePath, window.PUBLIC_ROOT ?? "");
  await loadLazyBricks(bricks);
  await iconsPromise;
}

async function loadDlls(adapterPkgFilePath: string, dlls?: string[]) {
  if (!Array.isArray(dlls)) {
    return;
  }
  if (dlls.includes("editor-bricks-helper")) {
    await loadDll(adapterPkgFilePath, "react-dnd");
  }
  for (const dll of dlls) {
    await loadDll(adapterPkgFilePath, dll);
  }
}

function loadDll(adapterPkgFilePath: string, dll: string) {
  let promise = dllPromises.get(dll);
  if (!promise) {
    promise = doLoadDll(adapterPkgFilePath, dll);
    dllPromises.set(dll, promise);
  }
  return promise;
}

async function doLoadDll(adapterPkgFilePath: string, dll: string) {
  const jsFile = window.DLL_PATH?.[dll];
  if (!jsFile) {
    throw new Error(`DLL ${dll} not found`);
  }
  await loadScript(
    `${adapterPkgFilePath.substring(
      0,
      adapterPkgFilePath.indexOf("/dist/")
    )}/dist/dll/${jsFile}`,
    window.PUBLIC_ROOT ?? ""
  );
}

async function loadMainDll(adapterPkgFilePath: string) {
  window.MIGRATE_TO_BRICK_NEXT_V3 = true;

  import("@next-core/styles-v3");

  await doLoadDll(adapterPkgFilePath, "");

  const dll = (window as unknown as { dll: DLL }).dll;

  const LegacyBrickKit = dll("tYg3");
  const LegacyReact = dll("q1tI");
  const LegacyI18next = dll("XzT5");
  const LegacyReactI18next = dll("9kay");
  const LegacyHttp = dll("JxWY");
  const LegacyBrickIcons = dll("AE1K");
  const LegacyHistory = dll("LhCv");
  const LegacyJsYaml = dll("ZR4k");
  const LegacyFontAwesome = dll("9RIe");
  const LegacyLodash = dll("LvDl");
  const LegacyMoment = dll("wd/R");
  const LegacyAntd = dll("gdfu");
  const antdLocaleEnUS = dll("D7Yy");
  const { antdLocaleZhCN } = LegacyBrickKit;

  LegacyFontAwesome.initializeLibrary();

  defineModule(LegacyI18next, {
    default: i18n,
  });

  LegacyReactI18next.initReactI18next.init(i18n);

  defineModule(LegacyHttp, Http);
  defineModule(LegacyHistory, History);
  defineModule(LegacyJsYaml, JsYaml);
  LegacyLodash.__inject(lodash);
  LegacyMoment.__inject(moment);

  const { useFeatureFlags, FeatureFlagsProvider, DisplayByFeatureFlags } =
    getLegacyUseFeatureFlags(LegacyReact);
  const LegacyErrorBoundary = getLegacyErrorBoundary(LegacyReact);

  defineModule(LegacyBrickIcons, {
    BrickIcon({ category, icon }: EasyOpsIconProps) {
      return LegacyReact.createElement(ICONS_BRICK, {
        category,
        icon,
      });
    },
  });

  defineModule(LegacyBrickKit, {
    getRuntime: getLegacyRuntime,
    getHistory,
    handleHttpError,
    httpErrorToString,
    looseCheckIfByTransform: checkIfByTransform,
    looseCheckIfOfComputed: checkIfOfComputed,
    i18nText,
    StoryboardFunctionRegistryFactory,

    // Auth
    getAuth,
    authenticate,
    logout,
    isLoggedIn,

    // Theme and mode
    getCssPropertyValue,
    getCurrentTheme,
    getCurrentMode,
    batchSetAppsLocalTheme,
    applyTheme,

    BrickWrapper(props: { children: unknown }) {
      // istanbul ignore next
      const featureFlags =
        process.env.NODE_ENV === "test"
          ? {}
          : getLegacyRuntime().getFeatureFlags();
      return LegacyReact.createElement(
        LegacyErrorBoundary,
        null,
        LegacyReact.createElement(
          FeatureFlagsProvider,
          {
            value: featureFlags,
          },
          LegacyReact.createElement(
            LegacyAntd.ConfigProvider,
            {
              locale:
                i18n.language && i18n.language.split("-")[0] === "en"
                  ? antdLocaleEnUS
                  : antdLocaleZhCN,
              autoInsertSpaceInButton: false,
            },
            ...([] as unknown[]).concat(props.children)
          )
        )
      );
    },

    // Feature flags helpers
    useFeatureFlags,
    FeatureFlagsProvider,
    DisplayByFeatureFlags,

    useProvider: getLegacyUseProvider(LegacyReact),

    useCurrentTheme() {
      const [currentTheme, setCurrentTheme] = LegacyReact.useState(
        getCurrentTheme()
      );

      LegacyReact.useEffect(() => {
        const listenToThemeChange = (event: Event): void => {
          setCurrentTheme((event as CustomEvent<SiteTheme>).detail);
        };
        window.addEventListener("theme.change", listenToThemeChange);
        return () => {
          window.removeEventListener("theme.change", listenToThemeChange);
        };
      }, []);

      return currentTheme;
    },
    useApplyPageTitle(pageTitle: string) {
      LegacyReact.useEffect(() => {
        getLegacyRuntime().applyPageTitle(pageTitle);
      }, [pageTitle]);
    },

    ...getLegacyUseBrick(LegacyReact),

    ...getLegacyUseRecentApps(LegacyReact),
  });
}

function defineModule(target: object, modules: object) {
  for (const [key, value] of Object.entries(modules)) {
    Object.defineProperty(target, key, { value });
  }
}

customElements.define(
  "v2-adapter.load-bricks",
  createProviderClass(loadBricks)
);
