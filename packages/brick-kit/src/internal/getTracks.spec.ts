import { getTracks } from "./getTracks";

describe("getTracks", () => {
  it("basic usage", () => {
    const result1 = getTracks(
      '<% "track context", CTX.abc + CTX["xyz"] + CTX[DATA.non] %>'
    );
    expect(result1).toEqual({
      contextNames: ["abc", "xyz"],
      formStateNames: false,
      stateNames: false,
    });

    const result2 = getTracks(
      '<%= CTX.abc + CTX["xyz"] + CTX[DATA.non] + STATE.a + STATE["b"] %>'
    );
    expect(result2).toEqual({
      contextNames: ["abc", "xyz"],
      formStateNames: false,
      stateNames: ["a", "b"],
    });
  });

  it("no track", () => {
    const result1 = getTracks('<% "track context", DATA %>');
    expect(result1).toEqual({
      contextNames: false,
      formStateNames: false,
      stateNames: false,
    });

    const result2 = getTracks("<%= DATA.CTX.a %>");
    expect(result2).toEqual({
      contextNames: false,
      formStateNames: false,
      stateNames: false,
    });
  });
});
