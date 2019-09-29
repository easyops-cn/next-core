const modifyResponse = require("./modifyResponse");
const { getSingleBrickPackage, getSingleStoryboard } = require("./utils");

module.exports = env => {
  const {
    useOffline,
    useSubdir,
    useRemote,
    publicPath,
    localBrickPackages,
    localMicroApps,
    server
  } = env;

  const pathRewriteFactory = seg =>
    useSubdir
      ? undefined
      : {
          [`^/${seg}`]: `/next/${seg}`
        };

  const proxyPaths = ["api"];
  const otherProxyOptions = {};
  if (useRemote) {
    proxyPaths.push("bricks", "micro-apps");
    if (localBrickPackages.length > 0 || localMicroApps.length > 0) {
      otherProxyOptions.onProxyRes = (proxyRes, req, res) => {
        // 设定透传远端请求时，可以指定特定的 brick packages 和 micro apps 使用本地文件。
        if (
          req.path === "/next/api/auth/bootstrap" ||
          req.path === "/api/auth/bootstrap"
        ) {
          modifyResponse(res, proxyRes, raw => {
            const result = JSON.parse(raw);
            const { data } = result;
            if (localMicroApps.length > 0) {
              data.storyboards = data.storyboards
                .map(item => {
                  if (item.app && localMicroApps.includes(item.app.id)) {
                    return getSingleStoryboard(env, item.app.id);
                  }
                  return item;
                })
                .filter(Boolean);
            }
            if (localBrickPackages.length > 0) {
              data.brickPackages = data.brickPackages.map(item => {
                const id = item.filePath.split("/")[1];
                if (localBrickPackages.includes(id)) {
                  return getSingleBrickPackage(env, id);
                }
                return item;
              });
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
            "dev-only-login-page": `http://localhost:8081${publicPath}auth/login`
          },
          ...otherProxyOptions
        };
        return acc;
      }, {});
};
