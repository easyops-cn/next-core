import { flowApi } from "@next-core/easyops-runtime";
import type { MockRule, Mocks } from "@next-core/types";

let mockId: string | null = null;
let mockList: MockRule[] = [];

export function registerMocks(mocks: Mocks | undefined) {
  if (!mocks) {
    mockId = null;
    mockList = [];
    return;
  }
  mockId = mocks.mockId;
  mockList = mocks.mockList.map((mock) => ({
    ...mock,
    uri: `${
      flowApi.isFlowApiProvider(mock.provider)
        ? mock.uri.replace(/(.+?)\/(.+)/, (_match, p1, p2) => {
            return `/${p1}(@\\d+\\.\\d+\\.\\d+)?/${p2}$`;
          })
        : `/${mock.uri.split(".").slice(2).join(".")}$`
    }`.replace(/:\w+/g, "([^/]+)"),
  }));
}

export function getMock(
  url: string,
  method: string | undefined
):
  | {
      mockId: string;
      url: string;
    }
  | undefined {
  if (
    mockId === null ||
    !mockList.some(
      (m) =>
        new RegExp(m.uri).test(url) &&
        normalizeMethod(m.method) === method?.toUpperCase()
    )
  ) {
    return;
  }
  return {
    mockId,
    url: url
      .replace(
        /(^|\/)(api\/gateway\/.+?)(?:@\d+\.\d+\.\d+)?\/(.+)/,
        (_match, p1, p2, p3) => {
          // 忽略版本
          return `${p1}${p2}/${p3}`;
        }
      )
      .replace(
        /(^|\/)api\/gateway\//,
        `$1api/gateway/mock_server.proxy.${mockId}/`
      ),
  };
}

function normalizeMethod(method: string | undefined) {
  const upperMethod = method?.toUpperCase();
  return upperMethod === "LIST" ? "GET" : upperMethod;
}
