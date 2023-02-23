import os from "node:os";
import { Api } from "./internal.js";
import { TypeDefinition } from "./TypeDefinition.js";
import { getTransformedUri, getParamsInUri } from "../utils.js";

export class FunctionBlock {
  static uriPrefix = "api/gateway";

  static formDataBlock = `const _formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      const k = \`\${key}[]\`;
      value.forEach(v => {
        _formData.append(k, v);
      });
    } else {
      _formData.append(key, value);
    }
  }`;

  constructor(private api: Api) {
    api.imports.add(["http", "HttpOptions"], "@next-core/http");
    if (api.method.isSugar) {
      api.imports.add("ResponseListWrapper", "./wrapper.js");
    }
    if (
      api.responseWrapper &&
      !(api.responseBodyType as TypeDefinition).isFile
    ) {
      api.imports.add("ResponseBodyWrapper", "./wrapper.js");
    }
  }

  private getApiUrlAndParams(): { url: string; args: string[] } {
    const uri = this.api.doc.endpoint.uri.replace(/^\//, "");
    const uriParams = getParamsInUri(uri);

    // If the sdk is for api_gateway itself,
    // the url prefix and service name should be ignored.
    let url =
      this.api.context.serviceSeg === "api_gateway"
        ? ""
        : `${FunctionBlock.uriPrefix}/${this.api.serviceName}/`;

    let quote: string;
    if (uriParams.length > 0) {
      quote = "`";
      url += getTransformedUri(uri);
    } else {
      quote = '"';
      url += uri;
    }
    return {
      url: `${quote}${url}${quote}`,
      args: uriParams.map((p) => `${p}: string|number`),
    };
  }

  toString(): string {
    const api = this.api;
    let { requestParamsType, requestBodyType, responseBodyTypeName, doc } = api;
    const { url, args } = this.getApiUrlAndParams();

    const { isFormData } = requestBodyType;
    const { isFile } = api.responseBodyType as TypeDefinition;
    if (isFile) {
      responseBodyTypeName = "Blob";
    }

    // let callArgsString;
    const argKeys = [];
    const optionsKeys = [];
    if (requestParamsType.value) {
      args.push(`params: ${requestParamsType.name}`);
      optionsKeys.push("params");
    }
    if (requestBodyType.value) {
      args.push(`data: ${requestBodyType.name}`);
      argKeys.push(isFormData ? "_formData" : "data");
    } else if (api.method.isComplex) {
      // Fill an `undefined` if a complex request has no body.
      argKeys.push("undefined");
    }
    if (isFile) {
      optionsKeys.push('responseType:"blob"');
    }
    const optionsString =
      optionsKeys.length > 0
        ? `{...options,${optionsKeys.join(",")}}`
        : "options";
    const callArgsString = [...argKeys, optionsString].join(",");

    args.push("options?: HttpOptions");

    let asyncPrefix;
    let returnBlock;
    if (responseBodyTypeName === "void") {
      asyncPrefix = "";
      returnBlock = `http.${api.method.realName}<void>(${url},${callArgsString});`;
    } else if (isFile) {
      asyncPrefix = "";
      returnBlock = `http.${api.method.realName}<Blob>(${url},${callArgsString});`;
    } else if (api.responseWrapper) {
      asyncPrefix = "async ";
      returnBlock = `(await http.${api.method.realName}<ResponseBodyWrapper<${responseBodyTypeName}>>(${url},${callArgsString})).data;`;
    } else {
      asyncPrefix = "";
      returnBlock = `http.${api.method.realName}<${responseBodyTypeName}>(${url},${callArgsString});`;
    }

    const contractComment = `/**! @contract easyops.api.${this.api.serviceName}@${this.api.doc.version} */`;

    if (isFormData) {
      returnBlock = `{ ${contractComment} ${FunctionBlock.formDataBlock} return ${returnBlock}; }`;
    } else {
      returnBlock = `${contractComment} ${returnBlock}`;
    }

    const annotations = [];
    const { description, endpoint, detail } = doc;

    annotations.push(
      `@description ${description}${detail ? ` (${detail})` : ""}`
    );

    annotations.push(`@endpoint ${endpoint.method} ${endpoint.uri}`);

    const content = `/** ${os.EOL} * ${annotations.join(`${os.EOL}* `)} ${
      os.EOL
    } */`;

    return `${content}${os.EOL}export const ${
      api.exportName
    } = ${asyncPrefix}(${args.join(
      ","
    )}): Promise<${responseBodyTypeName}> => ${returnBlock}`;
  }
}
