import jsYaml from "js-yaml";
import bootstrapJson from "./bootstrapJson.js";
import mockAuth from "./mockAuth.js";
import singleAppBootstrapJson from "./singleAppBootstrapJson.js";
import standaloneBootstrapJson from "./standaloneBootstrapJson.js";
import serveBricksWithVersions from "./serveBricksWithVersions.js";
import { serveBricks } from "@next-core/serve-helpers";

const { safeDump, JSON_SCHEMA } = jsYaml;

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
      middleware(_req, res) {
        res.send({
          code: 0,
          data: {
            settings: env.localSettings ?? {},
          },
        });
      },
    });
    middlewares.push({
      path: `${baseHref}api/gateway/micro_app_standalone.runtime.RuntimeMicroAppStandalone/api/v1/micro_app_standalone/runtime/:appId`,
      middleware(_req, res) {
        res.send({
          code: 0,
          data: null,
        });
      },
    });
    middlewares.push({
      path: `${baseHref}api/gateway/data_exchange.store.ClickHouseInsertData/api/v1/data_exchange/frontend_stat`,
      middleware(_req, res) {
        res.send({
          code: 0,
          data: null,
        });
      },
    });
  }

  return middlewares;
}

export function getPreMiddlewares(env) {
  const { baseHref, localMicroApps, userConfigByApps } = env;

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
      path: `${baseHref}sa-static/${appId}/versions/0.0.0/webroot/conf.yaml`,
      middleware(_req, res) {
        if (userConfigByApps) {
          const conf = {
            user_config_by_apps: userConfigByApps,
          };
          const content = safeDump(conf, {
            indent: 2,
            schema: JSON_SCHEMA,
            skipInvalid: true,
            noRefs: true,
            noCompatMode: true,
          });
          res.type(".yaml");
          res.send(content);
        } else {
          res.status(204);
          res.send();
        }
      },
    });
  }

  middlewares.push({
    path: `${baseHref}sa-static/-/bricks/`,
    middleware: serveBricksWithVersions(env),
  });

  middlewares.push({
    path: `${baseHref}bricks/`,
    middleware: serveBricks(env),
  });

  return middlewares;
}
