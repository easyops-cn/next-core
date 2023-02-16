// @ts-check
/** @type {import("@next-core/build-next-bricks").BuildNextBricksConfig} */
export default {
  // optimization: {
  //   splitChunks: {
  //     cacheGroups: {
  //       defaultVendors: {
  //         test: /[\\/]node_modules[\\/]|[\\/]next-core[\\/]packages[\\/]/,
  //         priority: -10,
  //         reuseExistingChunk: true,
  //         name(module, chunks) {
  //           let moduleFileName = module
  //             .identifier()
  //             .split('/')
  //             .reduceRight((item) => item);
  //           const moduleId = module.identifier();
  //           const matches = moduleId.match(/[\\/](?:node_modules|next-core[\\/]packages)[\\/]((?:@[^\\/@]+[\\/])?(?:[^\\/@]+))/);
  //           if (matches) {
  //             moduleFileName = matches[1].replace("@", "").replace("/", "~");
  //           } else {
  //             console.log(moduleId);
  //           }
  //           // const allChunksNames = chunks.map((item) => item.name).join('~');
  //           return `vendors~${moduleFileName}`;
  //         },
  //       },
  //       default: {
  //         minChunks: 2,
  //         priority: -20,
  //         reuseExistingChunk: true,
  //       },
  //     },
  //   },
  // }
};
