import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import _ from "lodash";
import { getSizeCheckApp } from "./sizeCheck.js";

export function getStoryboards({ rootDir, localMicroApps }, full) {
  const storyboards = Promise.all(
    localMicroApps.map(async (appId) => ({
      ...(await getSingleStoryboard(rootDir, appId)),
      ...(full
        ? null
        : {
            meta: null,
            routes: null,
          }),
    }))
  );
  return storyboards;
}

export async function getSingleStoryboard(rootDir, appId) {
  const sizeCheckApp = getSizeCheckApp();
  if (appId === sizeCheckApp.id) {
    return { app: sizeCheckApp };
  }
  const filePath = path.join(
    rootDir,
    "mock-micro-apps",
    appId,
    "storyboard.yaml"
  );
  if (!existsSync(filePath)) {
    return null;
  }
  const content = await readFile(filePath, "utf-8");
  const storyboard = yaml.safeLoad(content);
  return storyboard;
}

export async function getMatchedStoryboard(env, pathname) {
  const storyboards = await getStoryboards(env);
  // Put apps with longer homepage before shorter ones.
  // E.g., `/legacy/tool` will match first before `/legacy`.
  // This enables two apps with relationship of parent-child of homepage.
  const sortedStoryboards = _.orderBy(
    storyboards,
    (storyboard) => storyboard.app?.homepage.length,
    "desc"
  );
  for (const storyboard of sortedStoryboards) {
    const homepage = storyboard.app?.homepage;
    if (typeof homepage === "string" && homepage[0] === "/") {
      if (
        homepage === "/"
          ? pathname === homepage
          : `${pathname.replace(/\/+$/, "")}/`.startsWith(
              `${homepage.replace(/\/+$/, "")}/`
            )
      ) {
        return storyboard;
      }
    }
  }
}
