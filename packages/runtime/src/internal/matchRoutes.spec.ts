import { matchRoutes } from "./matchRoutes.js";

const consoleError = jest.spyOn(console, "error").mockImplementation();

describe("matchStoryboard", () => {
  test("handle path not string", async () => {
    await expect(() =>
      matchRoutes(
        [{}] as any,
        {
          app: {
            homepage: "/x",
          },
          location: {
            pathname: "/x/y",
          },
        } as any
      )
    ).rejects.toMatchInlineSnapshot(
      `[Error: Invalid route with invalid type of path: undefined]`
    );
    expect(consoleError).toBeCalledWith("Invalid route with invalid path:", {});
  });
});
