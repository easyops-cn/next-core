import { MicroApp } from "@easyops/brick-types";
import { MicroAppModels } from "@sdk/micro-app-sdk";

export type RelatedApp = MicroAppModels.ModelObjectMicroApp;

export interface VisitedWorkspace {
  appId: string;
  appName: string;
  appLocaleName: string;
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

export interface CustomApiOrchestration {
  name: string;
  namespace: string;
  contract?: {
    endpoint: {
      uri: string;
      method:
        | "POST"
        | "post"
        | "PUT"
        | "put"
        | "GET"
        | "get"
        | "DELETE"
        | "delete"
        | "LIST"
        | "list"
        | "PATCH"
        | "patch"
        | "HEAD"
        | "head";
    };
    response?: {
      wrapper?: boolean;
      [key: string]: any;
    };
    [key: string]: any;
  };
  config?: Record<string, any>;
  type?: "emal" | "swagger";
}
