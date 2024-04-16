import { responseInterceptor } from "http-proxy-middleware";
import _ from "lodash";
import jsYaml from "js-yaml";
import { getBrickPackages } from "@next-core/serve-helpers";
import { getStoryboards } from "./utils/getStoryboards.js";
import { fixV2Storyboard } from "./utils/fixV2Storyboard.js";
import { injectIndexHtml } from "./utils/injectIndexHtml.js";
import { concatBrickPackages } from "./utils/concatBrickPackages.js";

const { safeDump, JSON_SCHEMA } = jsYaml;

export default function getProxy(env, getRawIndexHtml) {
  const {
    rootDir,
    localMicroApps,
    baseHref,
    useRemote,
    useLocalContainer,
    localBricks,
    localBrickFolders,
    userConfigByApps,
    host,
    port,
    server,
  } = env;
  if (useRemote) {
    return [
      {
        ...getBasicProxyOptions(env, "api/websocket_service/"),
        ws: true,
      },
      {
        ...getBasicProxyOptions(env, "api/"),
        selfHandleResponse: true,
        bypass(req) {
          const appId = getAppIdFromBootstrapPath(req.path);
          if (localMicroApps.includes(appId)) {
            return req.path;
          }
        },
        onProxyReq(proxyReq, req) {
          // Reset the origin header to the remote server
          if (req.headers["origin"] === `http://${host}:${port}`) {
            proxyReq.setHeader("origin", server);
          }
        },
        onProxyRes: responseInterceptor(
          async (responseBuffer, _proxyRes, req, res) => {
            if (res.statusCode !== 200) {
              return responseBuffer;
            }

            const secureCookieFlags = ["SameSite=None", "Secure"];
            const setCookies = res.getHeader("set-cookie");
            if (
              req.method === "POST" &&
              req.path === "/next/api/auth/login/v2" &&
              Array.isArray(setCookies)
            ) {
              const strategy =
                env.cookieSameSiteNone && env.host === "localhost"
                  ? "add"
                  : env.https
                    ? null
                    : "clear";
              if (strategy) {
                // Note: it seems that now Chrome (v107) requires `SameSite=None` even for localhost.
                // However, `Secure` can use used with non-http for localhost.
                res.setHeader(
                  "set-cookie",
                  setCookies.map((cookie) => {
                    const separator = "; ";
                    const parts = cookie.split(separator);

                    // Add "SameSite=None; Secure"
                    if (strategy === "add") {
                      for (const part of secureCookieFlags) {
                        if (!parts.includes(part)) {
                          parts.push(part);
                        }
                      }
                      return parts.join(separator);
                    }

                    // Clear "SameSite=None; Secure"
                    const filteredParts = [];
                    for (const part of parts) {
                      if (!secureCookieFlags.includes(part)) {
                        filteredParts.push(part);
                      }
                    }
                    return filteredParts.join(separator);
                  })
                );
                console.log(`${strategy} same site for cookies`);
              }
            }

            if (req.method !== "GET") {
              return responseBuffer;
            }

            const brickPreviewInDeveloperDoc =
              req.path === "/next/api/v1/api_gateway/bricks";
            if (
              req.path === "/next/api/auth/v2/bootstrap" ||
              brickPreviewInDeveloperDoc
            ) {
              const content = responseBuffer.toString("utf-8");
              const result = JSON.parse(content);
              const data = result.data;

              const [storyboards, brickPackages] = await Promise.all([
                getStoryboards({ rootDir, localMicroApps }),
                getBrickPackages(localBrickFolders, false, localBricks),
              ]);

              const brickPackagesField = brickPreviewInDeveloperDoc
                ? "bricksInfo"
                : "brickPackages";

              // Todo: filter out local micro-apps and brick packages
              data.storyboards = storyboards
                .concat(data.storyboards)
                .filter(Boolean);
              data[brickPackagesField] = concatBrickPackages(
                brickPackages,
                data[brickPackagesField]
              );

              if (env.localSettings) {
                mergeLocalSettings(data, env.localSettings);
              }

              removeCacheHeaders(res);
              return JSON.stringify(result);
            }

            if (
              env.localSettings &&
              req.path === "/next/api/v1/runtime_standalone"
            ) {
              const content = responseBuffer.toString("utf-8");
              const result = JSON.parse(content);
              const { data } = result;

              mergeLocalSettings(data, env.localSettings);

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
          async (responseBuffer, _proxyRes, req, res) => {
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
            if (
              res.statusCode < 200 ||
              (res.statusCode >= 300 && req.method !== "GET")
            ) {
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
                    const appIdMatch = content.match(
                      /\bAPP_ID\s*=\s*("[^"]+")/
                    );
                    const appId = appIdMatch ? JSON.parse(appIdMatch[1]) : null;
                    const appRootMatches = content.match(
                      /\bAPP_ROOT\s*=\s*("[^"]+")/
                    );
                    if (!appRootMatches) {
                      const message = "Unexpected: APP_ROOT is not found";
                      console.log(message, content);
                      throw new Error(message);
                    }
                    const appRoot = JSON.parse(appRootMatches[1]);

                    const unionAppRoot = content.match(
                      /\b(var\s*\w+\s*=\s*w\.UNION_APP_ROOT\s*=\s*[^;]*\s*;)/
                    )?.[1];

                    const bootstrapUnionMatches = content.match(
                      /\b(w\.BOOTSTRAP_UNION_FILE\s*=\s*[^;]*\s*;)/
                    );

                    const bootstrapUnionFilePath = bootstrapUnionMatches?.[1];

                    let publicDeps = content.match(
                      /\bw\.PUBLIC_DEPS\s*=\s*(\[[^;]*\])\s*;/
                    )?.[1];

                    if (publicDeps && localBricks?.length) {
                      try {
                        const parsedPublicDeps = JSON.parse(publicDeps).filter(
                          (item) =>
                            !localBricks.includes(item.filePath.split("/")[1])
                        );

                        publicDeps = JSON.stringify(parsedPublicDeps);
                      } catch (_err) {
                        console.error(`JSON.parse() error: ${publicDeps}`);
                      }
                    }

                    const appRootTpl = content.match(
                      /(w\.APP_ROOT_TPL\s*=\s*[^;]*\s*;)/
                    )?.[1];

                    const bootstrapHashMatches = content.match(
                      /\bbootstrap(-pubDeps|-mini)?\.([^."]+)\.json\b/
                    );
                    if (!bootstrapHashMatches) {
                      const message = "Unexpected: bootstrapHash is not found";
                      console.log(message, content);
                      throw new Error(message);
                    }

                    const reverseBootstrapMatches =
                      bootstrapHashMatches.reverse();
                    const bootstrapHash = reverseBootstrapMatches[0];

                    const bootstrapPathPrefix = reverseBootstrapMatches[1];

                    const bootstrapFilePath = content.match(
                      /\b(w\.BOOTSTRAP_FILE\s*=\s*[^;]*\s*;)/
                    )?.[1];

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
                      appId,
                      appRoot,
                      publicPrefix,
                      bootstrapHash,
                      bootstrapPathPrefix,
                      coreVersion,
                      noAuthGuard,
                      publicDeps,
                      appRootTpl,
                      bootstrapFilePath,
                      unionAppRoot,
                      bootstrapUnionFilePath,
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
              //ignore bootstrap.mini.ac3eb.json, because it has no brickPackages information
              /^\/next\/sa-static\/[^/]+\/versions\/[^/]+\/webroot\/-\/bootstrap(?:-pubDeps)?\.[^.]+\.json$/.test(
                req.path
              ) ||
              /^\/next\/sa-static\/.*\/bootstrap-union\.[^.]+\.json$/.test(
                req.path
              )
            ) {
              try {
                const content = responseBuffer.toString("utf-8");
                const result = JSON.parse(content);

                const [storyboards, brickPackages] = await Promise.all([
                  getStoryboards({ rootDir, localMicroApps }, true),
                  getBrickPackages(localBrickFolders, true, localBricks),
                ]);

                result.brickPackages = concatBrickPackages(
                  brickPackages,
                  result.brickPackages
                );
                result.storyboards = storyboards.concat(result.storyboards);

                // Make it compatible with v2 apps.
                // delete result.templatePackages;

                removeCacheHeaders(res);
                return JSON.stringify(result);
              } catch (error) {
                console.error("Stub bootstrap.json failed:", error);
              }
            }

            if (
              /^\/next\/sa-static\/[^/]+\/versions\/[^/]+\/webroot\/conf\.yaml$/.test(
                req.path
              ) ||
              /^\/next\/[^/]+\/conf\.yaml$/.test(req.path)
            ) {
              removeCacheHeaders(res);
              if (userConfigByApps) {
                if (res.statusCode === 204) {
                  res.statusCode = 200;
                  res.statusMessage = "OK";
                }
                const conf = {
                  user_config_by_apps: userConfigByApps,
                };
                return safeDump(conf, {
                  indent: 2,
                  schema: JSON_SCHEMA,
                  skipInvalid: true,
                  noRefs: true,
                  noCompatMode: true,
                });
              }
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

function mergeLocalSettings(data, localSettings) {
  const { featureFlags, homepage, brand, misc } = localSettings;
  data.featureFlags ??= {};
  data.brand ??= {};
  data.misc ??= {};
  Object.assign(data.settings.featureFlags, featureFlags);
  Object.assign(data.settings.brand, brand);
  Object.assign(data.settings.misc, misc);
  if (homepage) {
    data.settings.homepage = homepage;
  }
}
