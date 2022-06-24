import { Mocks, MockRule } from "@next-core/brick-types/src/manifest";
import { isCustomApiProvider } from "./FlowApi";

let mocks: Mocks = {
  mockId: null,
  mockList: [],
};

export function registerMock(useMocks: Mocks): void {
  if (useMocks)
    mocks = {
      ...useMocks,
      mockList: useMocks.mockList?.map((item) => {
        const isFlowAPi = isCustomApiProvider(item.provider);
        return {
          ...item,
          uri: `${
            isFlowAPi
              ? item.uri.replace(/(.+?)\/(.+)/, (_match, p1, p2) => {
                  return `/${p1}(@\\d+\\.\\d+\\.\\d+)?/${p2}$`;
                })
              : `/${item.uri.split(".").slice(2).join(".")}$`
          }`.replace(/:\w+/g, "([^/]+)"),
        };
      }),
    };
}

export function getMockList(): MockRule[] {
  return mocks.mockList;
}

export const getMockInfo = (
  requestUrl: string,
  method: string
):
  | {
      url: string;
      mockId: string;
    }
  | undefined => {
  const transformGetMethod = (method: string): string => {
    if (method.toUpperCase() === "LIST") {
      return "GET";
    }
    return method?.toUpperCase();
  };
  const item = mocks.mockList.find(
    (item) =>
      new RegExp(item.uri).test(requestUrl) &&
      transformGetMethod(item.method) === method?.toUpperCase()
  );
  if (item) {
    return {
      url: requestUrl
        .replace(
          /(api\/gateway\/.+?)(@\d+\.\d+\.\d+)?\/(.+)/,
          (_match, p1, _p2, p3) => {
            // 忽略版本
            return `${p1}/${p3}`;
          }
        )
        .replace(
          /(api\/gateway)/,
          `api/gateway/mock_server.proxy.${mocks.mockId}`
        ),
      mockId: mocks.mockId,
    };
  }
  return;
};
