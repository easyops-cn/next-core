import { trackContext } from "./trackContext";

const consoleWarn = jest
  .spyOn(console, "warn")
  .mockImplementation(() => void 0);

describe("trackContext", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return tracking contexts", () => {
    expect(
      trackContext(
        "<% 'track context', CTX.good1(CTX['good2'], () => CTX.good3, DATA.bad1, CTX[bad2], (CTX) => CTX.bad3, CTX) %>"
      )
    ).toEqual(["good1", "good2", "good3"]);
  });

  it("should return false for non-track-ctx mode", () => {
    expect(trackContext("<% CTX.bad %>")).toBe(false);
    expect(trackContext("<% 'oops', 'track context', CTX.bad %>")).toBe(false);
    expect(trackContext("<% track.CTX, CTX.bad %>")).toBe(false);
  });

  it("should return false if no CTX usage were found", () => {
    expect(trackContext("<% 'track context', () => DATA.bad %>")).toBe(false);
    expect(consoleWarn).toBeCalled();
  });
});
