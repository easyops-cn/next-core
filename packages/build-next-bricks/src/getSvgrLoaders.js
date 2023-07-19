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
        icon: options.icon ?? false,
        svgoConfig: {
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: {
                  // Keep `viewbox`
                  removeViewBox: false,

                  convertColors: {
                    currentColor: options.convertCurrentColor ?? !!options.icon,
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
