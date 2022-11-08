import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "67qbbe",
  videoUploadOnPasses: false,
  env: {
    ports: [8081, 8082, 8083, 9001],
    mainPort: [8081],
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config);
    },
    specPattern: "cypress/e2e/**/*.{js,jsx,ts,tsx}",
  },
});
