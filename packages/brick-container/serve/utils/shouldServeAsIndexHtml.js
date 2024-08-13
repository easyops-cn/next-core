/**
 * @param {import("express").Request} req
 * @param {boolean} isHome
 * @param {boolean} proxiedHome
 * @returns {boolean}
 */
export function shouldServeAsIndexHtml(req, isHome, proxiedHome) {
  return (
    req.method === "GET" &&
    (isHome
      ? !proxiedHome && req.path === "/"
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
