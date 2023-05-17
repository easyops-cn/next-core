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
        {
          path: `\${APP.homepage}/-`,
          bricks: [
            {
              brick: "ul",
              children: brickPackages.flatMap((pkg) =>
                pkg.bricks.concat(pkg.elements ?? []).map((brick) => ({
                  brick: "li",
                  properties: {
                    textContent: brick,
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
            preLoadBricks: [brick],
            bricks: [
              {
                brick: "p",
                properties: { textContent: "This is size-check!" },
              },
            ],
          }))
        ),
      ],
    },
  ];
}
