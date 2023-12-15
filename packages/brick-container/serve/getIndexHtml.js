const path = require("path");
const fs = require("fs");
const { escapeRegExp } = require("lodash");
const { appendLiveReloadScript } = require("./utils");

const distDir = path.dirname(
  require.resolve("@next-core/brick-container/dist/index.html")
);

exports.distDir = distDir;

const injectIndexHtml = (standaloneConfig, env, content) => {
  if (env.liveReload) {
    content = appendLiveReloadScript(content, env);
  }

  // Replace nginx ssi placeholders.
  content = content
    .replace(
      new RegExp(
        escapeRegExp("<!--# echo var='base_href' default='/' -->"),
        "g"
      ),
      env.baseHref
    )
    .replace(
      new RegExp(
        escapeRegExp("<!--# echo var='core_root' default='' -->"),
        "g"
      ),
      `${env.publicCdn ?? ""}${
        standaloneConfig
          ? standaloneConfig.standaloneVersion === 2
            ? `${standaloneConfig.publicPrefix}core/${standaloneConfig.coreVersion}/`
            : `${standaloneConfig.appRoot}-/core/`
          : ""
      }`
    )
    .replace(
      new RegExp(
        escapeRegExp("<!--# echo var='mock_date' default='' -->"),
        "g"
      ),
      env.mockDate ?? ""
    )
    .replace(
      new RegExp(
        escapeRegExp("<!--# echo var='public_cdn' default='' -->"),
        "g"
      ),
      env.publicCdn ?? ""
    );

  if (standaloneConfig) {
    content = content.replace(
      "</head>",
      [
        "<script>",
        "((w)=>{",
        "w.STANDALONE_MICRO_APPS=!0;",
        `var a=w.APP_ROOT=${JSON.stringify(standaloneConfig.appRoot)};`,
        standaloneConfig.noAuthGuard ? "w.NO_AUTH_GUARD=!0;" : "",
        (standaloneConfig.standaloneVersion === 2
          ? [
              "w.PUBLIC_ROOT_WITH_VERSION=!0",
              `w.APP_ID=${JSON.stringify(standaloneConfig.appId)}`,
              `var d=${JSON.stringify(standaloneConfig.publicPrefix)}`,
              'var p=w.PUBLIC_ROOT=(w.PUBLIC_CDN||"")+d',
              `w.CORE_ROOT=p+"core/${standaloneConfig.coreVersion}/"`,
              `w.BOOTSTRAP_FILE=a+"-/bootstrap${
                standaloneConfig.bootstrapPathPrefix ?? ""
              }.${standaloneConfig.bootstrapHash}.json"`,
            ]
          : [
              'var d=a+"-/"',
              'var p=w.PUBLIC_ROOT=(w.PUBLIC_CDN||"")+d',
              'w.CORE_ROOT=p+"core/"',
              `w.BOOTSTRAP_FILE=d+"bootstrap${
                standaloneConfig.bootstrapPathPrefix ?? ""
              }.${standaloneConfig.bootstrapHash}.json"`,
            ]
        )
          .filter(Boolean)
          .join(";"),
        "})(window)",
        "</script></head>",
      ].join("")
    );
  }

  return content;
};

const getRawIndexHtml = () => {
  const indexHtml = path.join(distDir, "index.html");
  return fs.readFileSync(indexHtml, "utf8");
};

const getIndexHtml = (standaloneConfig, env) => {
  const content = getRawIndexHtml(standaloneConfig, env);
  return injectIndexHtml(standaloneConfig, env, content);
};

exports.injectIndexHtml = injectIndexHtml;
exports.getRawIndexHtml = getRawIndexHtml;
exports.getIndexHtml = getIndexHtml;
