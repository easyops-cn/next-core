import { mockRule } from "@next-core/brick-types/src/manifest";
let useMockList: mockRule[] = [];

export function registerMock(mockList: mockRule[]): void {
  useMockList = mockList;
}

export function getMockList(): mockRule[] {
  return useMockList;
}

function getUrlRegExp(str: string): RegExp {
  return new RegExp(`${str.replace(/:\w+/g, "[\\w|-]+")}$`);
}

export const isMatchMockUrl = (requestUrl: string, uri: string): boolean => {
  const reg = getUrlRegExp(uri);
  return reg.test(requestUrl);
};

export const getMockRule = (requestUrl: string): mockRule => {
  return useMockList.find((item) => isMatchMockUrl(requestUrl, item.uri));
};
