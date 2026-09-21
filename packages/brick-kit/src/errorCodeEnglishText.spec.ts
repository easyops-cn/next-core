import "whatwg-fetch";
import i18next from "i18next";
import { HttpResponseError } from "@next-core/brick-http";
import {
  errorCodeEnglishText,
  normalizeLocale,
} from "./errorCodeEnglishText";

function mockLanguage(lang: string | undefined): void {
  Object.defineProperty(i18next, "language", {
    value: lang,
    configurable: true,
  });
}

function createResponseError(json?: any): HttpResponseError {
  return new HttpResponseError(
    new Response("", { status: 500, statusText: "Internal Server Error" }),
    json
  );
}

describe("normalizeLocale", () => {
  it.each([
    ["en", "en"],
    ["en-US", "en"],
    ["en-GB", "en"],
    ["en_US", "en"],
    ["EN-us", "en"],
    [" en ", "en"],
    ["zh", "zh"],
    ["zh-CN", "zh"],
    ["", ""],
    [undefined, ""],
  ])("should normalize %s to %s", (input, expected) => {
    expect(normalizeLocale(input as string)).toBe(expected);
  });
});

describe("errorCodeEnglishText", () => {
  const realLanguage = i18next.language;

  afterEach(() => {
    mockLanguage(realLanguage);
  });

  describe("when not in English", () => {
    it("should return undefined for zh", () => {
      mockLanguage("zh");
      expect(errorCodeEnglishText(createResponseError({ code: 133126 }))).toBe(
        undefined
      );
    });

    it("should return undefined for zh-CN", () => {
      mockLanguage("zh-CN");
      expect(errorCodeEnglishText(createResponseError({ code: 133126 }))).toBe(
        undefined
      );
    });

    it("should return undefined when language is unset", () => {
      mockLanguage(undefined);
      expect(errorCodeEnglishText(createResponseError({ code: 133126 }))).toBe(
        undefined
      );
    });
  });

  describe("when in English", () => {
    beforeEach(() => {
      mockLanguage("en");
    });

    it("should return the English identifier for a matched code", () => {
      expect(errorCodeEnglishText(createResponseError({ code: 133126 }))).toBe(
        "A duplicate instance already exists."
      );
    });

    it("should treat regional variants as English (en-US)", () => {
      mockLanguage("en-US");
      expect(errorCodeEnglishText(createResponseError({ code: 133126 }))).toBe(
        "A duplicate instance already exists."
      );
    });

    it.each([130303, 133137])(
      "should adopt the first definition for duplicated code %s",
      (code) => {
        // 130303: cmdb_service(DATABASE_QUERY_FAILED) 优先于 artifact(ERR_NOT_FIND_PACKAGE)
        // 133137: cmdb_service(LOGICAL_INSTANCE_RELATION_LIMIT_CHANGE) 优先于
        //         resource_manage(INSTANCE_INSERT_NEED_APPROVE)
        const expected =
          code === 130303
            ? "Query failed."
            : "The instance relation limit cannot be changed.";
        expect(
          errorCodeEnglishText(createResponseError({ code }))
        ).toBe(expected);
      }
    );

    it("should return the platform code identifier", () => {
      expect(
        errorCodeEnglishText(createResponseError({ code: 100000 }))
      ).toBe("Invalid argument. Please check the request parameters.");
    });

    it("should accept a string-typed code", () => {
      expect(
        errorCodeEnglishText(createResponseError({ code: "133126" }))
      ).toBe("A duplicate instance already exists.");
    });

    it("should return UNKNOWN_ERROR for an unmatched code", () => {
      expect(errorCodeEnglishText(createResponseError({ code: 999999 }))).toBe(
        "Unknown error."
      );
    });

    it("should return UNKNOWN_ERROR when code is missing", () => {
      expect(
        errorCodeEnglishText(createResponseError({ error: "oops" }))
      ).toBe("Unknown error.");
    });

    it("should return UNKNOWN_ERROR when code is not a finite number", () => {
      expect(
        errorCodeEnglishText(createResponseError({ code: "not-a-number" }))
      ).toBe("Unknown error.");
    });

    it("should return UNKNOWN_ERROR when responseJson is missing", () => {
      expect(errorCodeEnglishText(createResponseError())).toBe(
        "Unknown error."
      );
    });
  });
});
