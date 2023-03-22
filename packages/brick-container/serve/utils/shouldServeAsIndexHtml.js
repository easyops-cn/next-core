/**
 * @param {import("express").Request} req
 * @param {boolean} isHome
 * @returns {boolean}
 */
export function shouldServeAsIndexHtml(req, isHome) {
  return (
    req.method === "GET" &&
    (isHome
      ? req.path === "/"
      : ![
          "/api/",
          "/sa-static/",
          "/bricks/",
          "/templates/",
          "/assets/",
          "/user-assets/",
        ].some((p) => req.path.startsWith(p)))
  );
}
