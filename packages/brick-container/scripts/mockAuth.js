let username;

export default function mockAuth() {
  return async function (req, res, next) {
    if (req.path !== "/api/auth/login" || req.method !== "GET") {
      next();
      return;
    }
    res.json({
      code: 0,
      data: {
        loggedIn: !!username,
        username,
        org: username && 8888,
      },
    });
  };
}
