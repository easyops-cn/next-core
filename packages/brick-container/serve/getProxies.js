const modifyResponse = require("./modifyResponse");
const {
  getSingleBrickPackage,
  getSingleStoryboard,
  getSingleTemplatePackage,
  getSettings,
  mergeSettings,
  getUserSettings,
} = require("./utils");

module.exports = (env) => {
  const {
    useOffline,
    useSubdir,
    useRemote,
    publicPath,
    localBrickPackages,
    localMicroApps,
    localTemplates,
    useLocalSettings,
    useMergeSettings,
    server,
    mockedMicroApps,
  } = env;

  const pathRewriteFactory = (seg) =>
    useSubdir
      ? undefined
      : {
          [`^/${seg}`]: `/next/${seg}`,
        };

  const proxyPaths = ["api"];
  const otherProxyOptions = {};
  if (useRemote) {
    proxyPaths.push("bricks", "micro-apps", "templates");
    if (
      localBrickPackages.length > 0 ||
      localMicroApps.length > 0 ||
      localTemplates.length > 0 ||
      mockedMicroApps.length > 0 ||
      useLocalSettings ||
      useMergeSettings
    ) {
      otherProxyOptions.onProxyRes = (proxyRes, req, res) => {
        // 设定透传远端请求时，可以指定特定的 brick-packages, micro-apps, templates 使用本地文件。
        if (
          req.path === "/next/api/auth/bootstrap" ||
          req.path === "/api/auth/bootstrap"
        ) {
          modifyResponse(res, proxyRes, (raw) => {
            if (res.statusCode !== 200) {
              return raw;
            }
            const result = JSON.parse(raw);
            const { data } = result;
            if (localMicroApps.length > 0 || mockedMicroApps.length > 0) {
              data.storyboards = mockedMicroApps
                .map((id) => getSingleStoryboard(env, id, true))
                .concat(
                  localMicroApps.map((id) => getSingleStoryboard(env, id))
                )
                .filter(Boolean)
                .concat(
                  data.storyboards.filter(
                    (item) =>
                      !(item.app && localMicroApps.includes(item.app.id))
                  )
                );
            }
            if (localBrickPackages.length > 0) {
              data.brickPackages = localBrickPackages
                .map((id) => getSingleBrickPackage(env, id))
                .filter(Boolean)
                .concat(
                  data.brickPackages.filter(
                    (item) =>
                      !localBrickPackages.includes(item.filePath.split("/")[1])
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
              data.settings = getSettings();
            } else if (useMergeSettings) {
              data.settings = mergeSettings(data.settings, getUserSettings());
            }
            return JSON.stringify(result);
          });
        }
      };
    }
  }

  return useOffline
    ? undefined
    : proxyPaths.reduce((acc, seg) => {
        acc[`${publicPath}${seg}`] = {
          target: server,
          changeOrigin: true,
          pathRewrite: pathRewriteFactory(seg),
          headers: {
            "dev-only-login-page": `http://${env.host}:${env.port}${publicPath}auth/login`,
          },
          ...otherProxyOptions,
        };
        return acc;
      }, {});
};
