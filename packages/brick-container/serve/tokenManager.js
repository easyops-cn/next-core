const crypto = require("crypto");
const https = require("https");
const http = require("http");
const { URL } = require("url");
const chalk = require("chalk");

const TOKEN_CACHE_TTL = 1800 * 1000;
const CREDENTIALS_CACHE_TTL = 3600 * 1000;
const DEFAULT_APP_ID = "api_gateway";
const GATEWAY_INNER_PORT = 8107;
const GATEWAY_SERVICE_PATH = "/api/gateway/user_service.apikey";

const _tokenCache = {};
const _credentialsCache = {};

function generateSignature(
  method,
  urlPath,
  query,
  contentType,
  clientId,
  secret,
  timestamp
) {
  const keyList = Object.keys(query)
    .filter((k) => k !== "signature")
    .sort();

  const queryParts = [];
  for (const key of keyList) {
    const val = query[key];
    if (Array.isArray(val)) {
      for (const v of val) {
        queryParts.push(`${key}${v}`);
      }
    } else {
      queryParts.push(`${key}${val}`);
    }
  }

  const data = [
    method,
    urlPath,
    queryParts.join(""),
    contentType,
    clientId,
    secret,
    timestamp,
  ].join("\n");
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

function httpRequest(fullUrl, options, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(fullUrl);
    const mod = parsed.protocol === "https:" ? https : http;

    if (body) {
      options.headers = options.headers || {};
      options.headers["Content-Length"] = Buffer.byteLength(body);
    }

    const req = mod.request(
      fullUrl,
      { ...options, rejectUnauthorized: false, timeout: 30000 },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}`));
          }
        });
      }
    );
    req.on("error", (e) => reject(new Error(`network error: ${e.message}`)));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("request timeout"));
    });
    req.end(body || undefined);
  });
}

function getInnerGatewayUrl(serverUrl) {
  const parsed = new URL(serverUrl);
  return `http://${parsed.hostname}:${GATEWAY_INNER_PORT}${GATEWAY_SERVICE_PATH}`;
}

async function createServerApiKey(serverUrl, clientId) {
  const cacheKey = `${serverUrl}:${clientId}`;
  const now = Date.now();
  if (
    _credentialsCache[cacheKey] &&
    now < _credentialsCache[cacheKey].expireAt
  ) {
    return _credentialsCache[cacheKey].value;
  }

  const timestamp = String(Math.floor(now / 1000));
  const servicePath = "/api/v1/apikey/server";
  const signature = generateSignature(
    "POST",
    servicePath,
    {},
    "application/json",
    clientId,
    clientId,
    timestamp
  );

  const baseUrl = getInnerGatewayUrl(serverUrl);
  const fullUrl = `${baseUrl}${servicePath}`;
  console.log(
    chalk.cyan("[token-manager]"),
    "Creating server apikey for",
    clientId,
    "(via inner port)"
  );

  const data = await httpRequest(
    fullUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Timestamp": timestamp,
      },
    },
    JSON.stringify({ clientId, signature })
  );

  const secret = data.data?.secret;
  if (!secret) {
    throw new Error(
      `CreateServerApiKey: unexpected response: ${JSON.stringify(data)}`
    );
  }

  const value = { clientId, secret };
  _credentialsCache[cacheKey] = {
    value,
    expireAt: now + CREDENTIALS_CACHE_TTL,
  };
  return value;
}

async function requestToken(serverUrl, clientId, secret, user, org) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const servicePath = `/api/v1/apikey/request_token/client_id/${encodeURIComponent(
    clientId
  )}`;

  const query = {
    user: user || "defaultUser",
    org: org != null ? String(org) : "0",
  };
  query.signature = generateSignature(
    "GET",
    servicePath,
    query,
    "",
    clientId,
    secret,
    timestamp
  );

  const qs = Object.entries(query)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const baseUrl = getInnerGatewayUrl(serverUrl);
  const fullUrl = `${baseUrl}${servicePath}?${qs}`;
  const data = await httpRequest(fullUrl, {
    method: "GET",
    headers: { "X-Timestamp": timestamp },
  });

  if (data.code !== 0 || !data.data) {
    throw new Error(
      `RequestToken: unexpected response: ${JSON.stringify(data)}`
    );
  }
  return data.data.token || "";
}

async function getToken(serverUrl, auth) {
  if (auth.token) {
    return auth.token;
  }

  const appId = auth.appId || DEFAULT_APP_ID;
  const clientId = `easyops_server_${appId}`;
  const cacheKey = `${serverUrl}:${clientId}:${auth.org || ""}:${
    auth.user || ""
  }`;

  const now = Date.now();
  if (_tokenCache[cacheKey] && now < _tokenCache[cacheKey].expireAt) {
    return _tokenCache[cacheKey].token;
  }

  const creds = await createServerApiKey(serverUrl, clientId);
  const token = await requestToken(
    serverUrl,
    creds.clientId,
    creds.secret,
    auth.user,
    auth.org
  );
  _tokenCache[cacheKey] = { token, expireAt: now + TOKEN_CACHE_TTL };
  console.log(
    chalk.green("[token-manager]"),
    "Token acquired, cached for 30 minutes"
  );
  return token;
}

module.exports = { getToken };
