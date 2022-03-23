module.exports = function generateDeclarationsOfI18n() {
  const libName = "general";
  const libs = [
    {
      filePath: "builtin/general.d.ts",
      content: `declare const I18N: TFunction;

declare const I18N_TEXT: I18nTextFunction;

declare const IMG: {
  get(name: string): string;
};

declare const PERMISSIONS: {
  check(...actions: string[]): boolean;
};

declare const BASE_URL: string;

interface TFunction {
  // basic usage
  (
    key: string | string[],
    options?: Record<string, unknown> | string,
  ): string;
  // overloaded usage
  (
    key: string | string[],
    defaultValue?: string,
    options?: Record<string, unknown> | string,
  ): string;
}

interface I18nTextFunction {
  (data: I18nData): string;
}

interface I18nData {
  [language: string]: string;
}

declare const location: {
  readonly href: string;
  readonly origin: string;
}

declare const console: {
  log(...data: any[]): void;
  info(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
}
`,
    },
  ];

  return [libName, libs];
};
