import { authenticate, getAuth, logout } from "./auth";

describe("auth", () => {
  it("should work", () => {
    expect(getAuth()).toEqual({});
    authenticate({
      username: "mock-user",
      userInstanceId: "abc",
    });
    expect(getAuth()).toEqual({
      username: "mock-user",
      userInstanceId: "abc",
    });
    logout();
    expect(getAuth()).toEqual({});
  });
});
