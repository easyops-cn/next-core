let initialized = false;

export const useTranslation = () => {
  if (!initialized) {
    throw new Error("react-i18next is not initialized!");
  }
  return {
    t: (key) => key,
    i18n: {
      language: "zh-CN",
    },
  };
};

export const initReactI18next = {
  init: () => {
    initialized = true;
  },
};
