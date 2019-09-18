const path = require("path");
const fs = require("fs");
const express = require("express");
const httpProxyMiddleware = require("http-proxy-middleware");
const getEnv = require("./getEnv");
const serveLocal = require("./serveLocal");
const getProxies = require("./getProxies");

const app = express();

const distDir = path.dirname(
  require.resolve("@easyops/brick-container/dist/index.html")
);

const env = getEnv(process.cwd());
const port = env.port;

serveLocal(env, app);

const serveIndexHtml = (_req, res) => {
  const indexHtml = path.join(distDir, "index.html");
  const content = fs.readFileSync(indexHtml, "utf8");
  // Replace nginx ssi placeholders.
  res.send(
    content.replace(
      "<!--# echo var='base_href' default='/' -->",
      env.publicPath
    )
  );
};

// Serve index.html.
app.get(env.publicPath, serveIndexHtml);

// Serve static files.
app.use(env.publicPath, express.static(distDir));

// Using proxies.
const proxies = getProxies(env);
if (proxies) {
  for (const [path, options] of Object.entries(proxies)) {
    app.use(
      path,
      httpProxyMiddleware(
        Object.assign(
          {
            logLevel: "warn"
          },
          options
        )
      )
    );
  }
}

// All requests fallback to index.html.
app.use(serveIndexHtml);

app.listen(port);

console.log(`Started serving at: http://localhost:${port}${env.publicPath}`);
