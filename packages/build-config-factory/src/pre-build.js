const path = require("path");
const os = require("os");
const crypto = require("crypto");
const fs = require("fs-extra");
const changeCase = require("change-case");
const prettier = require("prettier");
const yaml = require("js-yaml");
const { escapeRegExp } = require("lodash");
const request = require("request");
const ora = require("ora");
const findDuplicatesProvider = (providers) => {
  const sortedProviders = providers.slice().sort();
  const results = [];
  for (let i = 0; i < sortedProviders.length - 1; i++) {
    if (sortedProviders[i + 1] === sortedProviders[i]) {
      results.push(sortedProviders[i]);
    }
  }
  return results;
};

const generateProviderElements = () => {
  const providersJson = require(path.join(process.cwd(), "providers.json"));
  const providersPackage = require(path.join(process.cwd(), "package.json"));
  const duplicatedProviders = findDuplicatesProvider(providersJson.providers);
  if (duplicatedProviders.length > 0) {
    throw new Error(`Duplicate providers: ${duplicatedProviders.join(", ")}`);
  }

  const packageName = providersPackage.name.split("/")[1];

  const defines = [];
  // const groupSet = new Set();
  const apiSet = new Set();
  for (const api of providersJson.providers) {
    const apiName = api.replace(".", "_");
    apiSet.add(apiName);
    defines.push(
      `customElements.define(
        "${packageName}.${changeCase.paramCase(apiName)}",
        createProviderClass(${apiName})
      );`
    );
  }
  const importPath = providersJson.sdk;

  const content = `import { createProviderClass } from "@next-core/brick-utils";
    import { ${Array.from(apiSet).join(",")} } from "${importPath}";

    ${defines.join(os.EOL)}`;

  const indexTsPath = path.join(process.cwd(), "src/index.ts");
  fs.outputFileSync(
    indexTsPath,
    prettier.format(content, { parser: "typescript" })
  );
  console.log("File created:", path.relative(process.cwd(), indexTsPath));
};

const generateLazyBricks = () => {
  const lazyBricksConfPath = path.resolve("src/lazy-bricks.yaml");
  if (!fs.existsSync(lazyBricksConfPath)) {
    return;
  }
  console.log("Find `src/lazy-bricks.yaml`, building lazy bricks...");
  const packageJson = require(path.resolve("package.json"));
  const packageName = packageJson.name.split("/")[1];

  // The chunk ids must be unique across foreign webpack bundles.
  // So we suffix these ids with the hash of the package name.
  const hash = crypto
    .createHash("sha1")
    .update(packageName)
    .digest("hex")
    .substr(0, 4);

  const lazyBricksTs = ['import { getRuntime } from "@next-core/brick-kit";'];
  const newFiles = [];
  const lazyBricksConf = yaml.safeLoad(
    fs.readFileSync(lazyBricksConfPath, "utf-8")
  );
  const flattenBricks = [];
  const flattenEntries = [];

  const pushNewBrick = (brick, entry) => {
    lazyBricksTs.push(
      `getRuntime().registerLazyBricks(
"${packageName}.${brick}",
() =>
  import(
    /* webpackChunkName: "lazy-bricks/${brick}.${hash}" */
    "../${entry}"
  )
);`
    );
    flattenBricks.push(brick);
    flattenEntries.push(entry);
  };

  for (const brick of lazyBricksConf.lazyBricks) {
    if (typeof brick === "string") {
      pushNewBrick(brick, brick);
    } else if (Array.isArray(brick.bricks)) {
      lazyBricksTs.push(
        `getRuntime().registerLazyBricks(
  [
    ${brick.bricks
      .map((item) =>
        typeof item === "string"
          ? `"${packageName}.${item}"`
          : `"${packageName}.${item.brick}"`
      )
      .join(`,${os.EOL}    `)}
  ],
  () =>
    import(
      /* webpackChunkName: "lazy-bricks/~${brick.group}.${hash}" */
      "./${brick.group}"
    )
);`
      );
      newFiles.push({
        filename: `${brick.group}.ts`,
        content: Array.from(
          new Set(
            brick.bricks
              .filter((item) => typeof item === "string" || item.entry)
              .map((item) =>
                typeof item === "string"
                  ? `import "../${item}";`
                  : `import "../${item.entry}";`
              )
          )
        ).join(os.EOL),
      });
      flattenBricks.push(
        ...brick.bricks.map((item) =>
          typeof item === "string" ? item : item.brick
        )
      );
      flattenEntries.push(
        ...brick.bricks
          .filter((item) => typeof item === "string" || item.entry)
          .map((item) => (typeof item === "string" ? item : item.entry))
      );
    } else {
      pushNewBrick(brick.brick, brick.entry);
    }
  }

  newFiles.push({
    filename: "index.ts",
    content: lazyBricksTs.join(os.EOL + os.EOL),
  });

  const targetDir = path.resolve("src/lazy-bricks");
  fs.emptyDirSync(targetDir);

  for (const { filename, content } of newFiles) {
    fs.outputFileSync(path.join(targetDir, filename), content);
  }

  const indexTsPath = path.resolve("src/index.ts");
  let indexTsContent = fs.readFileSync(indexTsPath, "utf-8");
  for (const entry of flattenEntries) {
    indexTsContent = indexTsContent.replace(
      new RegExp(`^import "\\./${escapeRegExp(entry)}";$`, "m"),
      "// !Lazy: $&"
    );
  }
  const importLazyBricksString = 'import "./lazy-bricks";';
  if (!indexTsContent.includes(importLazyBricksString)) {
    indexTsContent = `${indexTsContent}${importLazyBricksString}${os.EOL}`;
  }

  fs.outputFileSync(indexTsPath, indexTsContent);

  console.log(`${flattenBricks.length} lazy bricks are built successfully.`);
};

/**
 *
 * @param url
 * @param body '{"contract":[{"fullContractName":"easyops.api.sxy@CommitFlowSxy","version":"1.0.0"}]}',
 * @return {Promise<unknown>}
 */
function fetchContract(url, body) {
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        org: "8888",
        user: "defaultUser",
      },
      body: JSON.stringify(body),
      url,
    };

    function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        try {
          const contracts = JSON.parse(body).data.list;

          resolve(contracts);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(error);
      }
    }
    request(options, callback);
  });
}
async function collectProvidersContract() {
  const contractProvidersConfPath = path.resolve(
    "src/contract-declaration.yaml"
  );
  if (!fs.exists(contractProvidersConfPath)) {
    return;
  }

  console.log("Find `src/contract-declaration.yaml`, building contracts...");
  const contractProvidersConf = yaml.safeLoad(
    fs.readFileSync(contractProvidersConfPath, "utf-8")
  );

  if (!contractProvidersConf?.contract?.length) return;
  const { contract, env = "http://admin.easyops.local:10027" } =
    contractProvidersConf;
  const url = `${env}/api/v1/contract/batch_search`;
  let contracts;
  const spinner = ora("Collecting contracts").start();
  try {
    contracts = await fetchContract(url, { contract });
    spinner.succeed(`Collect contracts successfully!`);
    console.log(
      "Collected contracts:",
      contracts.map(
        (v) =>
          `[${v.serviceName ? "Contract Api" : "Flow Api"}] ${v.namespaceId}@${
            v.name
          }:${v.version} --> ${v.serviceName}${v.serviceName ? "." : ""}${
            v.name
          }@${v.version}`
      )
    );
  } catch (e) {
    spinner.fail("Collect contracts failed!");
    throw new Error(`Collect contract ${e}`);
  }
  const content = `const contracts:Contract[]= ${JSON.stringify(contracts)};`;
  const targetDir = path.resolve("src/contracts");
  fs.emptyDirSync(targetDir);
  const indexContractsString = [
    'import {collectContract} from "@next-core/brick-kit";',
    'import {Contract} from "@next-core/brick-types";',
  ];
  indexContractsString.push(content);
  indexContractsString.push(`collectContract(contracts)`);

  fs.outputFileSync(
    `${targetDir}/index.ts`,
    prettier.format(indexContractsString.join(""), { parser: "typescript" })
  );

  const indexTsPath = path.resolve("src/index.ts");
  let indexTsContent = fs.readFileSync(indexTsPath, "utf-8");
  const importContractsString = 'import "./contracts";';
  if (!indexTsContent.includes(importContractsString)) {
    indexTsContent = `${importContractsString}${os.EOL}${indexTsContent}`;
    fs.outputFileSync(
      indexTsPath,
      prettier.format(indexTsContent, { parser: "typescript" })
    );
  }
}

module.exports = async (scope = "micro-apps") => {
  if (scope === "providers") {
    generateProviderElements();
  } else if (scope === "bricks") {
    generateLazyBricks();
    await collectProvidersContract();
  }
};
