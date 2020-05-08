import { authenticate, getAuth, logout } from "./auth";

describe("auth", () => {
  it("should work", () => {
    expect(getAuth()).toEqual({});
    authenticate({
      org: 8888,
      username: "mock-user",
      userInstanceId: "abc",
    });
    expect(getAuth()).toEqual({
      org: 8888,
      username: "mock-user",
      userInstanceId: "abc",
    });
    logout();
    expect(getAuth()).toEqual({});
  });
});
