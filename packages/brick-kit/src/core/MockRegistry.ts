import { MockRule } from "@next-core/brick-types/src/manifest";
let useMockList: MockRule[] = [];

export function registerMock(mockList: MockRule[]): void {
  if (mockList) useMockList = mockList;
}

export function getMockList(): MockRule[] {
  return useMockList;
}

function getUrlRegExp(str: string): RegExp {
  return new RegExp(`${str.replace(/:\w+/g, "[\\w|-]+")}$`);
}

export const isMatchMockUrl = (requestUrl: string, uri: string): boolean => {
  const reg = getUrlRegExp(uri);
  return reg.test(requestUrl);
};

export const getMockRule = (requestUrl: string): MockRule => {
  return useMockList.find((item) => isMatchMockUrl(requestUrl, item.uri));
};
