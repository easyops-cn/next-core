const path = require("path");
const fs = require("fs-extra");

const allLibs = [];
const cases = [];

function addLib([libName, libs]) {
  allLibs.push(libName);

  fs.outputFileSync(
    path.join(__dirname, `../src/generated/${libName}.json`),
    JSON.stringify(libs, null, 2)
  );

  cases.push(
    `\n    case ${JSON.stringify(
      libName
    )}:\n      return (await import(/* webpackChunkName: ${JSON.stringify(
      `chunks/${libName}`
    )} */${JSON.stringify(`./${libName}.json`)})).default;`
  );
}

fs.readdirSync(path.join(__dirname, "libs"), { withFileTypes: true }).map(
  (dirent) => {
    if (dirent.isFile() && dirent.name.endsWith(".js")) {
      const generate = require(`./libs/${dirent.name}`);
      addLib(generate());
    }
  }
);

fs.outputFileSync(
  path.join(__dirname, "../src/generated/index.ts"),
  `import { DeclarationFile } from "../interfaces";

export const allLibs = ${JSON.stringify(allLibs)};

export async function importLib(lib: string): Promise<DeclarationFile[]> {
  switch (lib) {${cases.join("")}
    default:
      return [];
  }
}
`
);
