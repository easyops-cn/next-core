import { smartDisplayForEvaluableString } from "./smartDisplayForEvaluableString";

describe("smartDisplayForEvaluableString", () => {
  it.each<
    [params: [rawString: string, evaluationFallback?: string], result: string]
  >([
    [["Submit", "btn-submit"], "Submit"],
    [["<% I18N('BTN_SUBMIT') %>", "btn-submit"], "BTN_SUBMIT"],
    [["<% I18N('BTN_SUBMIT', 'Submit') %>", "btn-submit"], "Submit"],
    [["<% CTX.buttonName %>", "btn-submit"], "btn-submit"],
    [["<% CTX.buttonName %>"], "<% CTX.buttonName %>"],
  ])(
    "smartDisplayForEvaluableString(%j, %j) should return %j",
    ([rawString, evaluationFallback], result) => {
      expect(
        smartDisplayForEvaluableString(rawString, evaluationFallback)
      ).toEqual(result);
    }
  );
});
