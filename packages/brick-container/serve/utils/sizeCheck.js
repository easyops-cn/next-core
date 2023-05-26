export function getSizeCheckApp() {
  return {
    name: "Size Check",
    id: "-size-check-",
    homepage: "/-size-check-",
    noAuthGuard: true,
    standaloneMode: true,
  };
}

export function getSizeCheckStoryboards(brickPackages) {
  return [
    {
      app: getSizeCheckApp(),
      routes: [
        // By each brick
        {
          path: `\${APP.homepage}/-`,
          exact: true,
          bricks: [
            {
              brick: "ul",
              children: brickPackages.flatMap((pkg) =>
                pkg.bricks.concat(pkg.elements ?? []).map((brick) => ({
                  brick: "li",
                  properties: {
                    textContent: `${pkg.id.split("/")[1]}:${brick}`,
                  },
                }))
              ),
            },
            {
              brick: "p",
              properties: {
                textContent: "This is size-check index!",
              },
            },
          ],
        },
        ...brickPackages.flatMap((pkg) =>
          pkg.bricks.concat(pkg.elements ?? []).map((brick) => ({
            path: `\${APP.homepage}/${brick}`,
            exact: true,
            preLoadBricks: [brick],
            bricks: [
              {
                brick: "p",
                properties: { textContent: "This is size-check!" },
              },
            ],
          }))
        ),

        // By each package
        {
          path: `\${APP.homepage}/packages/-`,
          exact: true,
          bricks: [
            {
              brick: "ul",
              children: brickPackages.map((pkg) => ({
                brick: "li",
                properties: {
                  textContent: pkg.id.split("/")[1],
                },
              })),
            },
            {
              brick: "p",
              properties: {
                textContent: "This is size-check index!",
              },
            },
          ],
        },
        ...brickPackages.map((pkg) => ({
          path: `\${APP.homepage}/packages/${pkg.id.split("/")[1]}`,
          exact: true,
          preLoadBricks: pkg.bricks.concat(pkg.elements ?? []),
          bricks: [
            {
              brick: "p",
              properties: { textContent: "This is size-check!" },
            },
          ],
        })),

        // All together
        {
          path: `\${APP.homepage}/all`,
          exact: true,
          preLoadBricks: brickPackages.flatMap((pkg) =>
            pkg.bricks.concat(pkg.elements ?? [])
          ),
          bricks: [
            {
              brick: "p",
              properties: { textContent: "This is size-check!" },
            },
          ],
        },
      ],
    },
  ];
}
