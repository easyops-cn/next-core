import http from "node:http";
import https from "node:https";

// Resolve every request independently: logging out or changing accounts must
// take effect immediately, without reusing a previous request's identity.
export function resolveLoginIdentity(serverUrl, cookie) {
  if (!cookie)
    return Promise.reject(
      Object.assign(new Error("Login required"), { status: 401 })
    );
  const url = new URL("/next/api/auth/login", serverUrl);
  return new Promise((resolve, reject) => {
    const req = (url.protocol === "https:" ? https : http).get(
      url,
      {
        rejectUnauthorized: false,
        headers: { cookie, accept: "application/json" },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
          if (body.length > 1024 * 1024)
            req.destroy(new Error("Login response too large"));
        });
        res.on("error", reject);
        res.on("end", () => {
          if (res.statusCode === 401 || res.statusCode === 403) {
            reject(Object.assign(new Error("Login required"), { status: 401 }));
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error("Login service unavailable"));
            return;
          }
          try {
            const result = JSON.parse(body);
            const data = result.data;
            if (
              result.code !== 0 ||
              data?.loggedIn !== true ||
              typeof data.username !== "string" ||
              !data.username ||
              !Number.isInteger(Number(data.org)) ||
              Number(data.org) <= 0
            ) {
              reject(
                Object.assign(new Error("Login required"), { status: 401 })
              );
              return;
            }
            resolve({ org: Number(data.org), username: data.username });
          } catch {
            reject(new Error("Invalid login response"));
          }
        });
      }
    );
    req.setTimeout(10000, () =>
      req.destroy(new Error("Login service timeout"))
    );
    req.on("error", reject);
  });
}
