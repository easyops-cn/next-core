import { responseInterceptor } from "http-proxy-middleware";
import _ from "lodash";
import { getBrickPackages } from "@next-core/serve-helpers";
import { getStoryboards } from "./utils/getStoryboards.js";
import { fixV2Storyboard } from "./utils/fixV2Storyboard.js";
import { injectIndexHtml } from "./utils/injectIndexHtml.js";
import { concatBrickPackages } from "./utils/concatBrickPackages.js";

export default function getProxy(env, getRawIndexHtml) {
  const { rootDir, localMicroApps, baseHref, useRemote, useLocalContainer } =
    env;
  if (useRemote) {
    return [
      {
        ...getBasicProxyOptions(env, "api/"),
        selfHandleResponse: true,
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
              data.brickPackages = concatBrickPackages(
                brickPackages,
                data.brickPackages
              );
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
      getBasicProxyOptions(env, "bricks/"),
      getBasicProxyOptions(env, "sa-static/-/bricks/"),
      {
        ...getBasicProxyOptions(env, ""),
        selfHandleResponse: true,
        bypass(req) {
          if (
            useLocalContainer &&
            req.path.startsWith(`${baseHref}sa-static/-/core/`)
          ) {
            return req.path;
          }
        },
        onProxyRes: responseInterceptor(
          async (responseBuffer, proxyRes, req, res) => {
            if (
              baseHref !== "/next/" &&
              res.statusCode === 302 &&
              acceptTextHtml(req)
            ) {
              res.setHeader(
                "location",
                res.getHeader("location").replace(/^\/next\//, baseHref)
              );
              return responseBuffer;
            }
            if (res.statusCode !== 200 && req.method !== "GET") {
              return responseBuffer;
            }
            if ((res.getHeader("content-type") || "").includes("text/html")) {
              const content = responseBuffer.toString("utf-8");
              if (content.includes("/browse-happy.html")) {
                if (useLocalContainer) {
                  const rawIndexHtml = await getRawIndexHtml();
                  const standalone =
                    /\bSTANDALONE_MICRO_APPS\s*=\s*(?:!0|true)/.test(content);
                  if (standalone) {
                    const appRootMatches = content.match(
                      /\bAPP_ROOT\s*=\s*("[^"]+")/
                    );
                    if (!appRootMatches) {
                      const message = "Unexpected: APP_ROOT is not found";
                      console.log(message, content);
                      throw new Error(message);
                    }
                    const appRoot = JSON.parse(appRootMatches[1]);

                    const bootstrapHashMatches = content.match(
                      /\bbootstrap\.([^."]+)\.json\b/
                    );
                    if (!bootstrapHashMatches) {
                      const message = "Unexpected: bootstrapHash is not found";
                      console.log(message, content);
                      throw new Error(message);
                    }
                    const bootstrapHash = bootstrapHashMatches[1];

                    const noAuthGuard =
                      /\bNO_AUTH_GUARD\s*=\s*(?:!0|true)/.test(content);

                    const publicRootWithVersion =
                      /\bPUBLIC_ROOT_WITH_VERSION\s*=\s*(?:!0|true)/.test(
                        content
                      );

                    if (!publicRootWithVersion) {
                      throw new Error(
                        "Expect `PUBLIC_ROOT_WITH_VERSION` to be true in v3"
                      );
                    }

                    const publicPrefixMatches = content.match(
                      /\b(?:var\s+d\s*|w\.PUBLIC_PREFIX\s*)=\s*("[^"]+")/
                    );
                    if (!publicPrefixMatches) {
                      const message =
                        "Unexpected: PUBLIC_ROOT_WITH_VERSION is true while public-prefix is not found";
                      console.log(message, content);
                      throw new Error(message);
                    }
                    const originalPublicPrefix = JSON.parse(
                      publicPrefixMatches[1]
                    );

                    const publicPrefix =
                      baseHref === "/next/"
                        ? originalPublicPrefix
                        : originalPublicPrefix.replace(/^\/next\//, baseHref);
                    // const coreVersionMatches = raw.match(/"core\/(?:[^/]+)\/"/);
                    // const coreVersion = JSON.parse(coreVersionMatches[0]).split("/")[1];
                    const coreVersion = "0.0.0";

                    return injectIndexHtml(env, rawIndexHtml, {
                      appRoot,
                      publicPrefix,
                      bootstrapHash,
                      coreVersion,
                      noAuthGuard,
                    });
                  }
                  return injectIndexHtml(env, rawIndexHtml);
                } else if (baseHref !== "/next/") {
                  return content.replaceAll("/next/", baseHref);
                }
              }
            }
            if (
              /^\/next\/[^/]+\/-\/bootstrap\.[^.]+\.json$/.test(req.path) ||
              /^\/next\/sa-static\/[^/]+\/versions\/[^/]+\/webroot\/-\/bootstrap\.[^.]+\.json$/.test(
                req.path
              )
            ) {
              const content = responseBuffer.toString("utf-8");
              const result = JSON.parse(content);
              result.brickPackages = concatBrickPackages(
                await getBrickPackages(rootDir, true),
                result.brickPackages
              );
              delete result.templatePackages;
              removeCacheHeaders(res);
              return JSON.stringify(result);
            }
            return responseBuffer;
          }
        ),
      },
    ];
  }
}

function getBasicProxyOptions({ baseHref, server }, subPath) {
  return {
    context: `${baseHref}${subPath}`,
    target: server,
    secure: false,
    changeOrigin: true,
    pathRewrite:
      baseHref === "/next/"
        ? undefined
        : {
            [`^${_.escapeRegExp(baseHref)}${subPath}`]: `/next/${subPath}`,
          },
  };
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

/**
 * @param {import("express").Request} req
 */
function acceptTextHtml(req) {
  return /(?:^|,|;)text\/html(?:,|;|$)/.test(req.headers["accept"] || "");
}