import { responseInterceptor } from "http-proxy-middleware";
import _ from "lodash";
import { getBrickPackages } from "@next-core/serve-helpers";
import { getSingleStoryboard, getStoryboards } from "./utils/getStoryboards.js";

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
        // bypass(req) {
        //   if (req.path.startsWith(`${baseHref}api/auth/v2/bootstrap`)) {
        //     return req.path;
        //   }
        // },
        onProxyRes: responseInterceptor(
          async (responseBuffer, proxyRes, req, res) => {
            if (res.statusCode !== 200 || req.method !== "GET") {
              return responseBuffer;
            }
            if (req.path === "/next/api/auth/v2/bootstrap") {
              const content = responseBuffer.toString("utf-8");
              const result = JSON.parse(content);
              const data = result.data;
              data.storyboards = (
                await getStoryboards({ rootDir, localMicroApps })
              ).concat(data.storyboards);
              data.brickPackages = (await getBrickPackages(rootDir)).concat(
                data.brickPackages
              );
              removeCacheHeaders(res);
              return JSON.stringify(result);
            }
            const matchSingleAppBootstrap = req.path.match(
              /^\/next\/api\/auth\/v2\/bootstrap\/(\w+)$/
            );
            const appId = matchSingleAppBootstrap?.[1];
            if (appId && localMicroApps.includes(appId)) {
              const data = await getSingleStoryboard(rootDir, appId);
              removeCacheHeaders(res);
              return JSON.stringify({
                code: 0,
                data,
              });
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
