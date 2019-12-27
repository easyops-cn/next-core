// Ref https://github.com/jsdom/jsdom/issues/1030
import "document-register-element";
import {
  $PascalBrickName$,
  $PascalBrickName$Params
} from "./$PascalBrickName$";

describe("$PascalBrickName$", () => {
  it.each<[$PascalBrickName$Params, any]>([[{}, null]])(
    "$PascalBrickName$(%j) should work",
    async (params, result) => {
      expect(await $PascalBrickName$(params)).toEqual(result);
    }
  );
});
