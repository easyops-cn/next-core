import React from "react";

import Firewall from "./icons/firewall.svg";
import IdcView from "./icons/idc-view.svg";
import Router from "./icons/router.svg";
import Server from "./icons/server.svg";
import Switch from "./icons/switch.svg";
import Task from "./icons/task.svg";
import Tree from "./icons/tree.svg";

import AppAppDeployStatistics from "./icons/app/app-deploy-statistics.svg";
import AppIdc from "./icons/app/idc.svg";

const defaultCategory = {
  firewall: Firewall,
  "idc-view": IdcView,
  router: Router,
  server: Server,
  switch: Switch,
  task: Task,
  tree: Tree
};

const appCategory = {
  "app-deploy-statistics": AppAppDeployStatistics,
  idc: AppIdc
};

export type BrickIconCategory = "app";

interface BrickIconPropsOfDefault {
  icon: keyof typeof defaultCategory;
  category?: undefined;
}

interface BrickIconPropsOfApp {
  icon: keyof typeof appCategory;
  category: BrickIconCategory;
}

export type BrickIconProps = BrickIconPropsOfDefault | BrickIconPropsOfApp;

export const BrickIcon = (props: BrickIconProps): React.ReactElement => {
  const iconProps: Record<string, any> = {
    // Reset width and height.
    width: null,
    height: null,
    className: `easyops-icon easyops-icon-${props.icon}`
  };

  let icon: SvgrComponent;

  switch (props.category) {
    case undefined:
      icon = defaultCategory[(props as BrickIconPropsOfDefault).icon];
      break;
    case "app":
      icon = appCategory[(props as BrickIconPropsOfApp).icon];
      break;
  }

  if (icon) {
    return React.createElement(icon, iconProps);
  }

  return null;
};
