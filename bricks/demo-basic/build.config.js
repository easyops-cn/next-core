// @ts-check
/** @type {import("@next-core/build-next-bricks").BuildNextBricksConfig} */
export default {
  // extractCss: true,
  moduleFederationShared: {
    react: {
      singleton: false,
    },
    "react-dom": {
      singleton: false,
    },
  },
};
