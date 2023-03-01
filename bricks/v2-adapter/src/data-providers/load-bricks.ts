import { loadScript } from "@next-core/loader";
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
} from "@next-core/runtime";
import { i18n } from "@next-core/i18n";
import * as newHttp from "@next-core/http";
import * as newHistory from "history";
import { useTranslation } from "@next-core/i18n/react";
import newLodash from "lodash";
import newMoment from "moment";
import { getLegacyUseBrick } from "./legacy-brick-kit/getLegacyUseBrick.js";
import { getLegacyRuntime } from "./legacy-brick-kit/getLegacyRuntime.js";
import { loadLazyBricks } from "./legacy-brick-kit/LazyBrickRegistry.js";

// eslint-disable-next-line
// @ts-ignore
window.DLL_PATH = DLL_PATH;

const dllPromises = new Map<string, Promise<void>>();

interface DLL {
  (moduleId: string): any;
}

export async function loadBricks(
  adapterPkgFilePath: string,
  brickPkgFilePath: string,
  bricks: string[],
  dlls?: string[]
) {
  let mainPromise = dllPromises.get("");
  if (!mainPromise) {
    mainPromise = loadMainDll(adapterPkgFilePath);
    dllPromises.set("", mainPromise);
  }
  await mainPromise;
  await loadDlls(adapterPkgFilePath, dlls);
  await loadScript(brickPkgFilePath, window.PUBLIC_ROOT ?? "");
  await loadLazyBricks(bricks);
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

  const brickKit = dll("tYg3");
  const React = dll("q1tI");
  const i18next = dll("XzT5");
  const reactI18next = dll("9kay");
  const http = dll("JxWY");
  const history = dll("LhCv");
  const fontAwesome = dll("9RIe");
  const lodash = dll("LvDl");
  const moment = dll("wd/R");
  const antd = dll("gdfu");
  const antdLocaleEnUS = dll("D7Yy");

  fontAwesome.initializeLibrary();

  defineModule(i18next, {
    default: i18n,
  });

  defineModule(reactI18next, {
    useTranslation: useTranslation,
  });

  defineModule(http, newHttp);
  defineModule(history, newHistory);
  lodash.__inject(newLodash);
  moment.__inject(newMoment);

  defineModule(brickKit, {
    getRuntime: getLegacyRuntime,
    getHistory,

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

    // Todo: ErrorBoundary/FeatureFlagsProvider/ConfigProvider
    BrickWrapper(props: { children: unknown }) {
      return React.createElement(
        antd.ConfigProvider,
        {
          locale:
            i18n.language && i18n.language.split("-")[0] === "en"
              ? antdLocaleEnUS
              : brickKit.antdLocaleEnUS,
          autoInsertSpaceInButton: false,
        },
        ...([] as unknown[]).concat(props.children)
      );
    },

    ...getLegacyUseBrick(React),
  });
}

function defineModule(target: object, modules: object) {
  for (const [key, value] of Object.entries(modules)) {
    Object.defineProperty(target, key, {
      get() {
        return value;
      },
      configurable: false,
    });
  }
}

customElements.define(
  "v2-adapter.load-bricks",
  createProviderClass(loadBricks)
);
