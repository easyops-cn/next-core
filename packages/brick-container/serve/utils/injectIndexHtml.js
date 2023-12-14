export function injectIndexHtml(env, content, standaloneConfig) {
  // Replace nginx ssi placeholders.
  content = content
    .replaceAll("<!--# echo var='base_href' default='/' -->", env.baseHref)
    .replaceAll(
      "<!--# echo var='core_root' default='' -->",
      `${env.publicCdn ?? ""}${
        standaloneConfig
          ? `${standaloneConfig.publicPrefix}core/${standaloneConfig.coreVersion}/`
          : ""
      }`
    )
    .replaceAll("<!--# echo var='mock_date' default='' -->", env.mockDate ?? "")
    .replaceAll(
      "<!--# echo var='public_cdn' default='' -->",
      env.publicCdn ?? ""
    );

  if (standaloneConfig) {
    content = content.replace(
      "</head>",
      [
        "<script>",
        "((w)=>{",
        "w.STANDALONE_MICRO_APPS=!0;",
        standaloneConfig.appId
          ? `w.APP_ID = ${JSON.stringify(standaloneConfig.appId)};`
          : "",
        `var a=w.APP_ROOT=${JSON.stringify(standaloneConfig.appRoot)};`,
        standaloneConfig.noAuthGuard ? "w.NO_AUTH_GUARD=!0;" : "",
        "w.PUBLIC_ROOT_WITH_VERSION=!0;",
        `var d=${JSON.stringify(standaloneConfig.publicPrefix)};`,
        'var p=w.PUBLIC_ROOT=(w.PUBLIC_CDN||"")+d;',
        `w.CORE_ROOT=p+"core/${standaloneConfig.coreVersion}/";`,
        `w.BOOTSTRAP_FILE=a+"-/bootstrap.${standaloneConfig.bootstrapHash}${standaloneConfig.bootstrapPathSuffix}.json";`,
        "})(window)",
        "</script></head>",
      ].join("")
    );
  } else if (!env.useRemote) {
    content = content.replace(
      "</head>",
      "<script>window.NO_AUTH_GUARD=!0</script></head>"
    );
  }

  if (env.liveReload) {
    content = content.replace(
      "</body>",
      `<script>
  const socket = new WebSocket("ws://localhost:${env.wsPort}");
  socket.onmessage = function(event) {
    if (event.data === "content change") {
      location.reload();
    }
  };
</script></body>`
    );
  }

  return content;
}
