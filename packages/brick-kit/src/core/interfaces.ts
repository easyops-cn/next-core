import { MicroApp } from "@easyops/brick-types";
import { MicroAppModels } from "@sdk/micro-app-sdk";

export type RelatedApp = MicroAppModels.ModelObjectMicroApp;

export interface VisitedWorkspace {
  appId: string;
  appName: string;
  url: string;
}

export interface RecentApps {
  currentApp?: MicroApp;
  previousApp?: MicroApp;
  previousWorkspace?: VisitedWorkspace;
}

export type RouterState = "initial" | "ready-to-mount" | "mounted";

export interface RedirectConf {
  redirect?: string;
}
