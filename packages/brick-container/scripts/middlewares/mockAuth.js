import bodyParser from "body-parser";

let username;

export default function mockAuth() {
  /**
   * @param {import("express").Request} req
   */
  return async function (req, res, next) {
    if (req.path === "/login" && req.method === "GET") {
      res.json({
        code: 0,
        data: {
          loggedIn: !!username,
          username,
          org: username && 8888,
        },
      });
    } else if (req.path === "/login/v2" && req.method === "POST") {
      bodyParser.json()(req, res, () => {
        if (
          req.body &&
          req.body.username &&
          req.body.username === req.body.password
        ) {
          username = req.body.username;
          res.json({
            code: 0,
            data: {
              loggedIn: true,
              username,
              org: 8888,
            },
          });
        } else {
          console.warn("Login failed:", req.body);
          res.status(401);
          res.json({
            code: 133001,
            error: "用户名（邮箱）或密码错误",
            data: null,
          });
        }
      });
    } else {
      next();
    }
  };
}
