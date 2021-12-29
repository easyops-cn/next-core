import { Mocks, MockRule } from "@next-core/brick-types/src/manifest";

let mocks: Mocks = {
  mockId: null,
  mockList: [],
};

export function registerMock(useMocks: Mocks): void {
  if (useMocks)
    mocks = {
      ...useMocks,
      mockList: useMocks.mockList?.map((item) => ({
        ...item,
        uri: item.uri
          .replace(
            /(easyops\.api\.)(.+)(@\d+\.\d+\.\d+(?=\/))(.+)/,
            (_match, p1, p2, _p3, p4) => {
              return `(${p1})?${p2}(@\\d+\\.\\d+\\.\\d+)?${p4}$`;
            }
          )
          .replace(/:\w+/g, "[\\w|-]+"),
      })),
    };
}

export function getMockList(): MockRule[] {
  return mocks.mockList;
}

export const getMockId = (requestUrl: string): string | undefined => {
  if (mocks.mockList.find((item) => new RegExp(item.uri).test(requestUrl)))
    return mocks.mockId;
  return undefined;
};
