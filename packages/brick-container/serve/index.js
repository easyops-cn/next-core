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
    port: 9002,
    asCdn: true,
  });
  serve({
    ...defaultFlags,
    port: 9001,
    publicCdn: "http://localhost:9002/next/",
  });
} else {
  serve();
}
