import type { UseProviderArgsDefaults } from "./useProviderTypes.js";

export const useProviderArgsDefaults: UseProviderArgsDefaults = {
  provider: "",
  customOptions: {
    onError: () => {
      /* Do nothing.. */
    },
    transform: (oldData: any, newData: any) => newData,
    data: undefined,
    loading: false,
    suspense: false,
    cache: true,
  },
  dependencies: undefined,
};

export default Object.entries(useProviderArgsDefaults).reduce(
  (acc, [key, value]) => {
    if (Object.prototype.toString.call(value) === "[object Object]")
      return { ...acc, ...value };
    return { ...acc, [key]: value };
  },
  {} as UseProviderArgsDefaults
);
