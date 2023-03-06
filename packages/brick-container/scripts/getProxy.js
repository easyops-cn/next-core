import { responseInterceptor } from "http-proxy-middleware";
import _ from "lodash";
import { getBrickPackages } from "@next-core/serve-helpers";
import { getStoryboards } from "./utils/getStoryboards.js";
import { fixV2Storyboard } from "./utils/fixV2Storyboard.js";

export default function getProxy({
  rootDir,
  localMicroApps,
  baseHref,
  useRemote,
  server,
}) {
  if (useRemote) {
    return [
      {
        selfHandleResponse: true,
        context: `${baseHref}api`,
        target: server,
        secure: false,
        changeOrigin: true,
        pathRewrite:
          baseHref === "/next/"
            ? undefined
            : {
                [`^${_.escapeRegExp(baseHref)}api`]: "/next/api",
              },
        bypass(req) {
          const appId = getAppIdFromBootstrapPath(req.path);
          if (localMicroApps.includes(appId)) {
            return req.path;
          }
        },
        onProxyRes: responseInterceptor(
          async (responseBuffer, proxyRes, req, res) => {
            if (res.statusCode !== 200 || req.method !== "GET") {
              return responseBuffer;
            }

            if (req.path === "/next/api/auth/v2/bootstrap") {
              const content = responseBuffer.toString("utf-8");
              const result = JSON.parse(content);
              const data = result.data;

              const [storyboards, brickPackages] = await Promise.all([
                getStoryboards({ rootDir, localMicroApps }),
                getBrickPackages(rootDir),
              ]);

              // Todo: filter out local micro-apps and brick packages
              data.storyboards = storyboards.concat(data.storyboards);
              data.brickPackages = brickPackages.concat(data.brickPackages);
              removeCacheHeaders(res);
              return JSON.stringify(result);
            }

            const appId = getAppIdFromBootstrapPath(req.path);
            if (appId) {
              if (localMicroApps.includes(appId)) {
                throw new Error("Should bypass, this is a bug");
              }
              const content = responseBuffer.toString("utf-8");
              const result = JSON.parse(content);
              fixV2Storyboard(result.data);
              return JSON.stringify(result);
            }

            return responseBuffer;
          }
        ),
      },
      {
        context: `${baseHref}bricks`,
        target: server,
        secure: false,
        changeOrigin: true,
        pathRewrite:
          baseHref === "/next/"
            ? undefined
            : {
                [`^${_.escapeRegExp(baseHref)}bricks`]: "/next/bricks",
              },
      },
    ];
  }
}

/**
 * @param {import("express").Response} res
 */
function removeCacheHeaders(res) {
  res.removeHeader("cache-control");
  res.removeHeader("expires");
  res.removeHeader("etag");
  res.removeHeader("last-modified");
}

/**
 * @param {string} reqPath
 * @returns {string | undefined}
 */
function getAppIdFromBootstrapPath(reqPath) {
  const matchSingleAppBootstrap = reqPath.match(
    /^\/next\/api\/auth\/v2\/bootstrap\/([^/]+)$/
  );
  const appId = matchSingleAppBootstrap?.[1];
  return appId;
}
