import path from "node:path";
import express from "express";
import bootstrapJson from "./bootstrapJson.js";
import mockAuth from "./mockAuth.js";
import singleAppBootstrapJson from "./singleAppBootstrapJson.js";
import standaloneBootstrapJson from "./standaloneBootstrapJson.js";
import serveBricksWithVersions from "./serveBricksWithVersions.js";

export function getMiddlewares(env) {
  const { baseHref, useRemote, localMicroApps } = env;

  /**
   * @type {import("webpack-dev-server").Middleware[]}
   */
  const middlewares = [];

  for (const appId of localMicroApps) {
    middlewares.push({
      path: `${baseHref}api/auth/v2/bootstrap/${appId}`,
      middleware: singleAppBootstrapJson(env, appId),
    });
    middlewares.push({
      path: `${baseHref}sa-static/${appId}/versions/0.0.0/webroot/-/bootstrap.hash.json`,
      middleware: standaloneBootstrapJson(env, appId),
    });
  }

  if (!useRemote) {
    middlewares.push({
      path: `${baseHref}api/auth/`,
      middleware: mockAuth(),
    });
    middlewares.push({
      path: `${baseHref}api/auth/v2/bootstrap`,
      middleware: bootstrapJson(env),
    });
  }

  return middlewares;
}

export function getPreMiddlewares(env) {
  const { rootDir, baseHref } = env;

  /**
   * @type {import("webpack-dev-server").Middleware[]}
   */
  const middlewares = [];

  middlewares.push({
    path: `${baseHref}sa-static/-/bricks/`,
    middleware: serveBricksWithVersions(env),
  });

  middlewares.push({
    path: `${baseHref}bricks/`,
    middleware: express.static(path.join(rootDir, "node_modules/@next-bricks")),
  });

  middlewares.push({
    path: `${baseHref}bricks/`,
    middleware: express.static(path.join(rootDir, "node_modules/@bricks")),
  });

  return middlewares;
}
