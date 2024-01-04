const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { escapeRegExp } = require("lodash");
const { responseInterceptor } = require("http-proxy-middleware");
const modifyResponse = require("./modifyResponse");
const {
  getSingleBrickPackage,
  getSingleStoryboard,
  getSingleTemplatePackage,
  getSettings,
  mergeSettings,
  getUserSettings,
  getDevSettings,
  appendLiveReloadScript,
  tryFiles,
  removeCacheHeaders,
} = require("./utils");
const { injectIndexHtml } = require("./getIndexHtml");

module.exports = (env, getRawIndexHtml) => {
  const {
    useOffline,
    useSubdir,
    useRemote,
    baseHref,
    localBrickPackages,
    localEditorPackages,
    localSnippetPackages,
    localMicroApps,
    localTemplates,
    useDarkThemeApps,
    useLocalSettings,
    useMergeSettings,
    server,
    mockedMicroApps,
    brickPackagesDir,
    alternativeBrickPackagesDir,
    useLegacyBootstrap,
    legacyStandaloneAppsConfig,
    legacyAllAppsConfig,
    useLocalContainer,
  } = env;

  const pathRewriteFactory = (seg) =>
    useSubdir || seg.includes("/sa-static/")
      ? undefined
      : {
          [`^/${seg}`]: `/next/${seg}`,
        };

  const proxyPaths = ["api"];
  const apiProxyOptions = {
    headers: {
      "dev-only-login-page": `http${env.https ? "s" : ""}://${env.host}:${
        env.port
      }${baseHref}auth/login`,
    },
  };
  if (useRemote) {
    for (const standaloneConfig of legacyAllAppsConfig) {
      const assetRoot = standaloneConfig ? `${standaloneConfig.appRoot}-/` : "";
      if (standaloneConfig) {
        // 在「独立应用」模式中，静态资源路径在 `your-app/-/` 目录下。
        proxyPaths.push(assetRoot);
        proxyPaths.push(`${standaloneConfig.appRoot}conf.yaml`);
      } else {
        const assetPaths = ["bricks", "micro-apps", "templates"];
        proxyPaths.push(...assetPaths.map((p) => `${assetRoot}${p}`));
      }
    }

    if (env.isWebpackServe) {
      proxyPaths.push(
        "/next/sa-static/*/versions/*/webroot/-/**",
        "/sa-static/*/versions/*/webroot/-/**",
        "/next/auth/-/**",
        "/sa-static/**"
      );
    } else {
      proxyPaths.push(
        "(/next)?/sa-static/:appId/versions/:appVersion/webroot/-/",
        "/next/:appId/-/",
        "/sa-static/"
      );
    }

    apiProxyOptions.onProxyRes = (proxyRes, req, res) => {
      if (env.asCdn) {
        return;
      }
      // 设定透传远端请求时，可以指定特定的 brick-packages, micro-apps, templates 使用本地文件。

      let reqIsBootstrap =
        req.path === "/next/api/auth/bootstrap" ||
        req.path === "/next/api/auth/v2/bootstrap";
      let isStandalone = false;
      let publicRootWithVersion = false;
      if (!reqIsBootstrap) {
        const regex =
          /^(?:\/next)?\/sa-static\/[^/]+\/versions\/[^/]+\/webroot\/-\/bootstrap(?:-pubDeps)?\.[^.]+\.json$/;
        const regexLegacy = /^\/next\/[^/]+\/-\/bootstrap\.[^.]+\.json$/;

        const unionRegex =
          /^\/next\/sa-static\/[^/]+\/merge_apps\/[^/]+\/(?:v2|v3)\/bootstrap-union\.[^.]+\.json/;
        if (
          regex.test(req.path) ||
          regexLegacy.test(req.path) ||
          unionRegex.test(req.path)
        ) {
          reqIsBootstrap = true;
          isStandalone = true;
          publicRootWithVersion = true;
        }
        if (!reqIsBootstrap) {
          for (const standaloneConfig of legacyStandaloneAppsConfig) {
            const regex = new RegExp(
              `^${escapeRegExp(
                standaloneConfig.appRoot
              )}-/bootstrap\\.[^.]+\\.json$`
            );
            if (regex.test(req.path)) {
              reqIsBootstrap = true;
              isStandalone = true;
            }
          }
        }
      }

      if (reqIsBootstrap) {
        if (res.statusCode === 200) {
          // Disable cache for standalone bootstrap for development.
          removeCacheHeaders(proxyRes);
        }
        modifyResponse(res, proxyRes, (raw) => {
          if (res.statusCode !== 200) {
            return raw;
          }
          const result = JSON.parse(raw);
          const data = isStandalone ? result : result.data;
          if (localMicroApps.length > 0 || mockedMicroApps.length > 0) {
            data.storyboards = mockedMicroApps
              .map((id) =>
                getSingleStoryboard(env, id, true, {
                  brief: true,
                })
              )
              .concat(
                localMicroApps.map((id) =>
                  getSingleStoryboard(env, id, false, {
                    brief: true,
                  })
                )
              )
              .filter(Boolean)
              .concat(
                data.storyboards.filter(
                  (item) => !(item.app && localMicroApps.includes(item.app.id))
                )
              );
          }

          if (useDarkThemeApps.length > 0) {
            useDarkThemeApps.forEach((id) => {
              const find = data.storyboards.find((item) => item.app.id === id);
              if (find) {
                find.app.theme = "dark-v2";
              } else {
                console.warn(
                  chalk.yellow(
                    `Warning: micro app not found and dark mode cannot be used: ${id}`
                  )
                );
              }
            });
          }
          const combinedLocalBrickPackages = Array.from(
            new Set(localBrickPackages.concat(localEditorPackages))
          );
          if (combinedLocalBrickPackages.length > 0) {
            data.brickPackages = combinedLocalBrickPackages
              .map((id) =>
                getSingleBrickPackage(
                  env,
                  id,
                  data.brickPackages,
                  publicRootWithVersion
                )
              )
              .filter(Boolean)
              .concat(
                data.brickPackages.filter(
                  (item) =>
                    !combinedLocalBrickPackages.includes(
                      item.filePath.split("/")[1]
                    )
                )
              );
          }
          if (localTemplates.length > 0) {
            data.templatePackages = localTemplates
              .map((id) => getSingleTemplatePackage(env, id))
              .filter(Boolean)
              .concat(
                data.templatePackages.filter(
                  (item) =>
                    !localTemplates.includes(item.filePath.split("/")[1])
                )
              );
          }
          if (useLocalSettings) {
            data.settings = getSettings(env);
          } else {
            data.settings = mergeSettings(data.settings, getDevSettings());
            if (useMergeSettings) {
              data.settings = mergeSettings(
                data.settings,
                getUserSettings(env)
              );
            }
          }
          return JSON.stringify(result);
        });
      } else if (/api\/auth(\/v2)?\/bootstrap\/\w+/.test(req.path)) {
        modifyResponse(res, proxyRes, (raw) => {
          if (res.statusCode !== 200) {
            return raw;
          }
          const result = JSON.parse(raw);
          const { data } = result;
          if (useDarkThemeApps.includes(data.app.id)) {
            data.app.theme = "dark-v2";
          }

          return JSON.stringify(result);
        });
      } else if (
        /\/next\/api\/gateway\/next_builder\.build\.GetStoriesJson(V2)?\/api\/(v1|v2)\/next-builder\/storiesjson/.test(
          req.path
        )
      ) {
        modifyResponse(res, proxyRes, (raw) => {
          if (res.statusCode !== 200) {
            return raw;
          }
          const result = JSON.parse(raw);
          const { data } = result;
          localBrickPackages.forEach((pkgId) => {
            const filePath = tryFiles([
              path.join(brickPackagesDir, pkgId, "dist", "stories.json"),
              path.join(
                alternativeBrickPackagesDir,
                pkgId,
                "dist",
                "stories.json"
              ),
            ]);

            if (filePath) {
              const story = JSON.parse(fs.readFileSync(filePath, "utf-8"));
              // v2 接口用的是 id  v1用的是 storyId，这里需要兼容下
              data.list = [
                ...data.list.filter(
                  (v) =>
                    !story.some((s) => [v.storyId, v.id].includes(s.storyId))
                ),
                ...story,
              ];
            }
          });

          return JSON.stringify(result);
        });
      } else if (
        localSnippetPackages.length > 0 &&
        req.path ===
          "/next/api/gateway/cmdb.instance.PostSearchV3/v3/object/INSTALLED_BRICK_SNIPPET@EASYOPS/instance/_search"
      ) {
        modifyResponse(res, proxyRes, (raw) => {
          if (res.statusCode !== 200) {
            return raw;
          }
          const result = JSON.parse(raw);
          const { data } = result;
          localSnippetPackages.forEach((pkgId) => {
            const distPath = tryFiles([
              path.join(brickPackagesDir, pkgId, "dist-snippets/index.js"),
              path.join(brickPackagesDir, pkgId, "dist/snippets.json"),
              path.join(
                alternativeBrickPackagesDir,
                pkgId,
                "dist-snippets/index.js"
              ),
              path.join(
                alternativeBrickPackagesDir,
                pkgId,
                "dist/snippets.json"
              ),
            ]);
            if (distPath) {
              let snippets;
              try {
                // Clear require cache to get the newest output each time.
                delete require.cache[require.resolve(distPath)];
                snippets = require(distPath).snippets;
              } catch (e) {
                console.warn(`Load snippets from "${distPath}" failed:`, e);
              }
              if (Array.isArray(snippets)) {
                data.list = [
                  // Put local snippets before others.
                  ...snippets,
                  ...data.list.filter(
                    // Identify snippet by id.
                    (v) => !snippets.some((s) => s.id === v.id)
                  ),
                ];
              }
            }
          });
          data.total = data.list.length;
          return JSON.stringify(result);
        });
      } else if (
        (req.path === "/next/api/auth/login/v2" ||
          req.path === "/api/auth/login/v2") &&
        res.statusCode === 200 &&
        Array.isArray(proxyRes.headers["set-cookie"])
      ) {
        const secureCookieFlags = ["SameSite=None", "Secure"];
        if (env.cookieSameSiteNone) {
          // Note: it seems that now Chrome (v107) requires `SameSite=None` even for localhost.
          // However, `Secure` can use used with non-http for localhost.
          proxyRes.headers["set-cookie"] = proxyRes.headers["set-cookie"].map(
            (cookie) => {
              const separator = "; ";
              const parts = cookie.split(separator);
              for (const part of secureCookieFlags) {
                if (!parts.includes(part)) {
                  parts.push(part);
                }
              }
              return parts.join(separator);
            }
          );
        } else if (!env.https) {
          proxyRes.headers["set-cookie"] = proxyRes.headers["set-cookie"].map(
            (cookie) => {
              const separator = "; ";
              const parts = cookie.split(separator);
              const filteredParts = [];
              for (const part of parts) {
                if (!secureCookieFlags.includes(part)) {
                  filteredParts.push(part);
                }
              }
              return filteredParts.join(separator);
            }
          );
        }
      } else if (
        req.path === "/next/api/v1/runtime_standalone" ||
        req.path === "/api/v1/runtime_standalone"
      ) {
        if (res.statusCode === 200) {
          // Disable cache for standalone runtime for development.
          removeCacheHeaders(proxyRes);
        }
        modifyResponse(res, proxyRes, (raw) => {
          if (res.statusCode !== 200) {
            return raw;
          }
          const result = JSON.parse(raw);
          const { data } = result;
          if (useLocalSettings) {
            data.settings = getSettings(env);
          } else {
            data.settings = mergeSettings(data.settings, getDevSettings());
            if (useMergeSettings) {
              data.settings = mergeSettings(
                data.settings,
                getUserSettings(env)
              );
            }
          }
          return JSON.stringify(result);
        });
      }
    };
  }

  const rootProxyOptions = {};
  if (useRemote && !env.asCdn) {
    proxyPaths.push("");
    rootProxyOptions.bypass = (req) => {
      const corePathRegExp = new RegExp("^(/next)?/sa-static/-/core/[^/]+/");
      if (corePathRegExp.test(req.path)) {
        return `${baseHref}${req.path.replace(corePathRegExp, "")}`;
      }
    };
    rootProxyOptions.selfHandleResponse = true;
    rootProxyOptions.onProxyRes = responseInterceptor(
      async (responseBuffer, proxyRes, req, res) => {
        if (
          req.method === "GET" &&
          (req.get("accept") || "").includes("text/html")
        ) {
          if (res.statusCode === 200) {
            // Disable cache for standalone runtime for development.
            res.removeHeader("cache-control");
            res.removeHeader("expires");
            res.removeHeader("etag");
            res.removeHeader("last-modified");
          }
          const raw = responseBuffer.toString("utf-8");
          if (
            !(
              res.statusCode === 200 &&
              (res.get("content-type") || "").includes("text/html") &&
              raw.includes(`/browse-happy.html`)
            )
          ) {
            return raw;
          }
          if (useLocalContainer) {
            const rawIndexHtml = await getRawIndexHtml();
            const pathname = useSubdir
              ? req.path.replace(/^\/next\//, "/")
              : req.path;
            const standalone = /\bSTANDALONE_MICRO_APPS\s*=\s*(?:!0|true)/.test(
              raw
            );
            if (standalone) {
              const appIdMatch = raw.match(/\bAPP_ID\s*=\s*("[^"]+")/);
              const appId = appIdMatch ? JSON.parse(appIdMatch[1]) : "";
              const appDir = pathname
                .split("/")
                .slice(1, pathname.startsWith("/legacy/") ? 3 : 2)
                .concat("")
                .join("/");

              const appRootMatches = raw.match(/\bAPP_ROOT\s*=\s*("[^"]+")/);
              if (!appRootMatches) {
                const message = "Unexpected: APP_ROOT is not found";
                console.log(message, raw);
                throw new Error(message);
              }
              const appRoot = JSON.parse(appRootMatches[1]);

              const bootstrapUnionMatches = raw.match(
                /\b(merge_apps\/[^."]+\/(?:v2|v3)\/bootstrap-union\.[^."]+\.json)\b/
              );

              const bootstrapUnionFilePath = bootstrapUnionMatches?.[1];

              const bootstrapHashMatches = raw.match(
                /\bbootstrap(-pubDeps|-mini)?\.([^."]+)\.json\b/
              );
              if (!bootstrapHashMatches) {
                const message = "Unexpected: bootstrapHash is not found";
                console.log(message, raw);
                throw new Error(message);
              }
              const reverseBootstrapMatches = bootstrapHashMatches.reverse();
              const bootstrapHash = reverseBootstrapMatches[0];

              const bootstrapPathPrefix = reverseBootstrapMatches[1];

              const noAuthGuard = /\bNO_AUTH_GUARD\s*=\s*(?:!0|true)/.test(raw);

              const publicRootWithVersion =
                /\bPUBLIC_ROOT_WITH_VERSION\s*=\s*(?:!0|true)/.test(raw);

              if (publicRootWithVersion) {
                const publicPrefixMatches = raw.match(
                  /\bvar\s+d\s*=\s*(?:w\.PUBLIC_PREFIX\s*)?=\s*("[^"]+")/
                );
                if (!publicPrefixMatches) {
                  const message =
                    "Unexpected: PUBLIC_ROOT_WITH_VERSION is true while public-prefix is not found";
                  console.log(message, raw);
                  throw new Error(message);
                }
                const publicPrefix = JSON.parse(publicPrefixMatches[1]);

                // const coreVersionMatches = raw.match(/"core\/(?:[^/]+)\/"/);
                // const coreVersion = JSON.parse(coreVersionMatches[0]).split("/")[1];
                const coreVersion = "0.0.0";

                return injectIndexHtml(
                  {
                    appId,
                    appDir,
                    appRoot,
                    publicPrefix,
                    bootstrapHash,
                    bootstrapPathPrefix,
                    bootstrapUnionFilePath,
                    coreVersion,
                    noAuthGuard,
                    standaloneVersion: 2,
                  },
                  env,
                  rawIndexHtml
                );
              }
              return injectIndexHtml(
                {
                  appDir,
                  appRoot,
                  bootstrapHash,
                  bootstrapPathPrefix,
                  bootstrapUnionFilePath,
                  noAuthGuard,
                  standaloneVersion: 1,
                },
                env,
                rawIndexHtml
              );
            }
            return injectIndexHtml(null, env, rawIndexHtml);
          }
          const content = useSubdir ? raw : raw.replace(/\/next\//g, "/");
          return env.liveReload
            ? appendLiveReloadScript(content, env)
            : content;
        }
        return responseBuffer;
      }
    );
  }

  return useOffline
    ? undefined
    : {
        ...(env.asCdn
          ? {}
          : {
              [`${baseHref}api/websocket_service`]: {
                target: server,
                secure: false,
                changeOrigin: true,
                ws: true,
                headers: {
                  Origin: server,
                  referer: server,
                },
                pathRewrite: pathRewriteFactory("api/websocket_service"),
              },
            }),
        ...(useLegacyBootstrap
          ? {
              [`${baseHref}api/auth/v2/bootstrap`]: {
                target: server,
                secure: false,
                changeOrigin: true,
                pathRewrite: (path, req) => {
                  if (/api\/auth\/v2\/bootstrap$/.test(req.path)) {
                    return "/next/api/auth/bootstrap?brief=true";
                  } else if (/api\/auth\/v2\/bootstrap\/\w+/.test(req.path)) {
                    return path.replace("api/auth/v2", "/next/api/auth");
                  } else {
                    return path;
                  }
                },
                ...apiProxyOptions,
              },
            }
          : {}),
        ...proxyPaths.reduce((acc, seg) => {
          acc[
            seg.startsWith("/") || seg.startsWith("(/")
              ? seg
              : `${baseHref}${seg}`
          ] = {
            target: server,
            secure: false,
            changeOrigin: true,
            pathRewrite: pathRewriteFactory(seg),
            ...(seg === "api" || seg.endsWith("/-/") || seg.endsWith("/-/**")
              ? apiProxyOptions
              : seg === ""
              ? rootProxyOptions
              : null),
          };
          return acc;
        }, {}),
      };
};
