export default function getSvgrLoaders(options = {}) {
  return [
    {
      loader: "babel-loader",
      options: {
        rootMode: "upward",
      },
    },
    {
      loader: "@svgr/webpack",
      options: {
        babel: false,
        icon: true,
        svgoConfig: {
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: {
                  // Keep `viewbox`
                  removeViewBox: false,

                  convertColors: {
                    currentColor: options.convertCurrentColor ?? false,
                  },
                },
              },
            },
          ],
        },
      },
    },
  ];
}
