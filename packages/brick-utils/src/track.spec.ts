import {
  trackContext,
  trackFormState,
  trackState,
  trackUsedContext,
  trackUsedState,
} from "./track";

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

describe("trackState", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return tracking states", () => {
    expect(
      trackState(
        "<% 'track state', STATE.good1(STATE['good2'], () => STATE.good3, DATA.bad1, STATE[bad2], (STATE) => STATE.bad3, STATE) %>"
      )
    ).toEqual(["good1", "good2", "good3"]);
  });

  it("should return false for non-track-formstate mode", () => {
    expect(trackFormState("<% FORM_STATE.bad %>")).toBe(false);
    expect(
      trackFormState("<% 'oops', 'track formstate', FORM_STATE.bad %>")
    ).toBe(false);
    expect(trackFormState("<% track.FORM_STATE, FORM_STATE.bad %>")).toBe(
      false
    );
  });

  it("should return false if no FORM_STATE usage were found", () => {
    expect(trackFormState("<% 'track formstate', () => DATA.bad %>")).toBe(
      false
    );
    expect(consoleWarn).toBeCalled();
  });
});

describe("trackFormState", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return tracking form states", () => {
    expect(
      trackFormState(
        "<% 'track formstate', FORM_STATE.good1(FORM_STATE['good2'], () => FORM_STATE.good3, DATA.bad1, FORM_STATE[bad2], (FORM_STATE) => FORM_STATE.bad3, FORM_STATE) %>"
      )
    ).toEqual(["good1", "good2", "good3"]);
  });

  it("should return false for non-track-state mode", () => {
    expect(trackState("<% STATE.bad %>")).toBe(false);
    expect(trackState("<% 'oops', 'track state', STATE.bad %>")).toBe(false);
    expect(trackState("<% track.STATE, STATE.bad %>")).toBe(false);
  });

  it("should return false if no STATE usage were found", () => {
    expect(trackState("<% 'track state', () => DATA.bad %>")).toBe(false);
    expect(consoleWarn).toBeCalled();
  });
});

describe("trackUsedContext", () => {
  it("should return used context", () => {
    expect(
      trackUsedContext([
        "<% CTX.good1 %>",
        "<% CTX['good2'] %>",
        "<% STATE.bad1 %>",
      ])
    ).toEqual(["good1", "good2"]);
  });
});

describe("trackUsedState", () => {
  it("should return used state", () => {
    expect(
      trackUsedState([
        "<% STATE.good1 %>",
        "<% STATE['good2'] %>",
        "<% CTX.bad1 %>",
      ])
    ).toEqual(["good1", "good2"]);
  });
});
