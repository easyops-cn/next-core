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
        `var a=w.APP_ROOT=${JSON.stringify(standaloneConfig.appRoot)};`,
        standaloneConfig.noAuthGuard ? "w.NO_AUTH_GUARD=!0;" : "",
        "w.PUBLIC_ROOT_WITH_VERSION=!0;",
        `var d=${JSON.stringify(standaloneConfig.publicPrefix)};`,
        'var p=w.PUBLIC_ROOT=(w.PUBLIC_CDN||"")+d;',
        `w.CORE_ROOT=p+"core/${standaloneConfig.coreVersion}/";`,
        `w.BOOTSTRAP_FILE=a+"-/bootstrap.${standaloneConfig.bootstrapHash}.json";`,
        "})(window)",
        "</script></head>",
      ].join("")
    );
  }

  return content;
}
