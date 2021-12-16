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
} = require("./utils");
const fs = require("fs");
const path = require("path");

module.exports = (env) => {
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
    useLocalSettings,
    useMergeSettings,
    server,
    mockedMicroApps,
    brickPackagesDir,
    alternativeBrickPackagesDir,
    useLegacyBootstrap,
  } = env;

  const pathRewriteFactory = (seg) =>
    useSubdir
      ? undefined
      : {
          [`^/${seg}`]: `/next/${seg}`,
        };

  const proxyPaths = ["api"];
  const apiProxyOptions = {
    headers: {
      "dev-only-login-page": `http://${env.host}:${env.port}${baseHref}auth/login`,
    },
  };
  if (useRemote) {
    proxyPaths.push("bricks", "micro-apps", "templates");
    apiProxyOptions.onProxyRes = (proxyRes, req, res) => {
      // 设定透传远端请求时，可以指定特定的 brick-packages, micro-apps, templates 使用本地文件。
      if (
        req.path === "/next/api/auth/bootstrap" ||
        req.path === "/next/api/auth/v2/bootstrap"
      ) {
        modifyResponse(res, proxyRes, (raw) => {
          if (res.statusCode !== 200) {
            return raw;
          }
          const result = JSON.parse(raw);
          const { data } = result;
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
          const combinedLocalBrickPackages = Array.from(
            new Set(localBrickPackages.concat(localEditorPackages))
          );
          if (combinedLocalBrickPackages.length > 0) {
            data.brickPackages = combinedLocalBrickPackages
              .map((id) => getSingleBrickPackage(env, id, data.brickPackages))
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
      } else if (
        req.path ===
        "/next/api/gateway/next_builder.build.GetStoriesJson/api/v1/next-builder/storiesjson"
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
              data.list = [
                ...data.list.filter(
                  (v) => !story.some((s) => s.storyId === v.storyId)
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
      }
    };
  }

  const rootProxyOptions = {};
  if (!env.useLocalContainer) {
    proxyPaths.push("");
    rootProxyOptions.onProxyRes = (proxyRes, req, res) => {
      if (
        req.method === "GET" &&
        (req.get("accept") || "").includes("text/html")
      ) {
        modifyResponse(res, proxyRes, (raw) => {
          if (
            !(
              res.statusCode === 200 &&
              res.get("content-type") === "text/html" &&
              raw.includes("/next/browse-happy.html")
            )
          ) {
            return raw;
          }
          const content = env.useSubdir ? raw : raw.replace(/\/next\//g, "/");
          return env.liveReload
            ? appendLiveReloadScript(content, env)
            : content;
        });
      }
    };
  }

  return useOffline
    ? undefined
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
          acc[`${baseHref}${seg}`] = {
            target: server,
            secure: false,
            changeOrigin: true,
            pathRewrite: pathRewriteFactory(seg),
            ...(seg === "api"
              ? apiProxyOptions
              : seg === ""
              ? rootProxyOptions
              : null),
          };
          return acc;
        }, {}),
      };
};
