export const withTranslation = () => Component => {
  Component.defaultProps = {
    ...Component.defaultProps,
    t: key => key,
    i18n: {
      language: "zh-CN"
    }
  };
  return Component;
};

export const useTranslation = () => ({
  t: key => key,
  i18n: {
    language: "zh-CN"
  }
});
