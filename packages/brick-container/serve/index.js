const serve = require("./serve");

if (process.env.NODE_ENV === "e2e-test") {
  const defaultFlags = {
    subdir: true,
    standalone: true,
    liveReload: false,
  };
  serve(defaultFlags);
  serve({
    ...defaultFlags,
    standaloneMicroApps: true,
    port: 8082,
  });
  serve({
    ...defaultFlags,
    standaloneMicroApps: true,
    standaloneAppDir: "home/",
    port: 8083,
  });
  serve({
    ...defaultFlags,
    port: 8084,
    publicCdn: "http://localhost:8085/next/",
  });
  serve({
    ...defaultFlags,
    port: 8085,
    asCdn: true,
  });
} else {
  serve();
}
