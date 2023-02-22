import os from "node:os";
import path from "node:path";
import * as changeCase from "change-case";
import prettier from "prettier";
import { Api, Model } from "./internal.js";
import { FileWithContent, ContractDoc } from "../interface.js";

export class Context {
  readonly apiMap = new Map<string, Api>();
  readonly modelMap = new Map<string, Model>();
  readonly apiByModelExportsMap = new Map<string, string[]>();
  readonly modelByServiceExportsMap = new Map<string, string[]>();
  readonly namespaceI18nMap = new Map<string, unknown>();
  readonly modelI18nMap = new Map<string, unknown>();
  readonly indexApiExports: string[] = [];
  readonly indexModelExports: string[] = [];
  readonly contractList: ContractDoc[] = [];
  readonly serviceSeg: string;

  constructor(serviceSeg: string) {
    this.serviceSeg = serviceSeg;
  }

  toFiles(sdkRoot: string): FileWithContent[] {
    const apiByModelIndexes = Array.from(
      this.apiByModelExportsMap.entries()
    ).map(([modelSeg, apis]) => ({
      filePath: `./api/${this.serviceSeg}/${modelSeg}/index`,
      toString: () =>
        apis.map((api) => [`export * from "./${api}.js"`]).join(";"),
    }));

    const modelByServiceIndexes = Array.from(
      this.modelByServiceExportsMap.entries()
    ).map(([serviceSeg, models]) => ({
      filePath: `./model/${serviceSeg}/index`,
      toString: () =>
        models.map((model) => [`export * from "./${model}.js"`]).join(";"),
    }));

    const sdkIndexExports = this.indexApiExports
      .map(
        (modelSeg) =>
          `export * from "./api/${this.serviceSeg}/${modelSeg}/index.js";`
      )
      .concat(
        this.indexModelExports.map(
          (serviceSeg) =>
            `export * as ${changeCase.pascalCase(
              serviceSeg
            )}Models from "./model/${serviceSeg}/index.js";`
        )
      )
      .join(os.EOL);

    const sdkIndex = {
      filePath: "./index",
      toString: () => sdkIndexExports,
    };

    const contractDoc = {
      name: this.serviceSeg,
      description: this.namespaceI18nMap.get("description"),
      contracts: this.contractList,
    };

    return [
      ...Array.from(this.apiMap.values()),
      ...Array.from(this.modelMap.values()),
      ...apiByModelIndexes,
      ...modelByServiceIndexes,
      sdkIndex,
    ]
      .map<FileWithContent>((file) => [
        path.join(sdkRoot, "src", file.filePath + ".ts"),
        prettier.format(file.toString(), { parser: "typescript" }),
      ])
      .concat([
        [
          path.join(sdkRoot, "contracts.json"),
          JSON.stringify(contractDoc, null, 2),
        ],
      ]);
  }
}
