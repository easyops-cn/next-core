import _ from "lodash";

export default function getProxy({ baseHref, useRemote, server }) {
  if (useRemote) {
    return [
      {
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
        bypass(req) {
          if (req.path.startsWith(`${baseHref}api/auth/v2/bootstrap`)) {
            return req.path;
          }
        },
      },
    ];
  }
}
