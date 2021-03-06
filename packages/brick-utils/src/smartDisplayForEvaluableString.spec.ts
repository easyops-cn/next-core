import { smartDisplayForEvaluableString } from "./smartDisplayForEvaluableString";

describe("smartDisplayForEvaluableString", () => {
  it.each<[[unknown, unknown?, unknown?], unknown]>([
    [["Submit", "btn-submit", "btn-submit"], "Submit"],
    [["<% I18N('BTN_SUBMIT') %>", "btn-submit", "btn-submit"], "BTN_SUBMIT"],
    [
      ["<% I18N('BTN_SUBMIT', 'Submit') %>", "btn-submit", "btn-submit"],
      "Submit",
    ],
    [["<% CTX.buttonName %>", "btn-submit", "<% … %>"], "<% … %>"],
    [[undefined, "btn-submit", "<% … %>"], "btn-submit"],
    [[{}, "non-string"], "non-string"],
    [[{}], {}],
    [[undefined], undefined],
    [["<% CTX.buttonName %>"], "<% CTX.buttonName %>"],
  ])(
    "smartDisplayForEvaluableString(...%j) should return %j",
    ([rawString, nonStringFallback, unknownEvaluationFallback], result) => {
      expect(
        smartDisplayForEvaluableString(
          rawString,
          nonStringFallback,
          unknownEvaluationFallback
        )
      ).toEqual(result);
    }
  );
});
