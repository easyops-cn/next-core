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
      path: `${baseHref}sa-static/${appId}/versions/0.0.0/webroot/-/bootstrap.hash.json`,
      middleware: standaloneBootstrapJson(env, appId),
    });
    middlewares.push({
      path: `${baseHref}sa-static/${appId}/versions/0.0.0/webroot/conf.yaml`,
      middleware(req, res) {
        res.status(204);
        res.send();
      },
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
    middlewares.push({
      path: `${baseHref}api/v1/runtime_standalone`,
      middleware(req, res) {
        res.send({
          code: 0,
          data: {
            settings: env.localSettings ?? {},
          },
        });
      },
    });
  }

  return middlewares;
}

export function getPreMiddlewares(env) {
  const { baseHref, localMicroApps, localBrickFolders } = env;

  /**
   * @type {import("webpack-dev-server").Middleware[]}
   */
  const middlewares = [];

  for (const appId of localMicroApps) {
    middlewares.push({
      path: `${baseHref}api/auth/v2/bootstrap/${appId}`,
      middleware: singleAppBootstrapJson(env, appId),
    });
  }

  middlewares.push({
    path: `${baseHref}sa-static/-/bricks/`,
    middleware: serveBricksWithVersions(env),
  });

  for (const dir of localBrickFolders) {
    middlewares.push({
      path: `${baseHref}bricks/`,
      middleware: express.static(dir),
    });
  }

  return middlewares;
}
