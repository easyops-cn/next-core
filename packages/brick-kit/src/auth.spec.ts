import { authenticate, getAuth, logout } from "./auth";

describe("auth", () => {
  it("should work", () => {
    expect(getAuth()).toEqual({});
    authenticate({
      username: "mock-user"
    });
    expect(getAuth()).toEqual({
      username: "mock-user"
    });
    logout();
    expect(getAuth()).toEqual({});
  });
});
