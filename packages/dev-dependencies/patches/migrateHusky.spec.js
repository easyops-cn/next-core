const fs = require("fs");
const execa = require("execa");
const migrateHusky = require("./migrateHusky");
const { writeJsonFile, readJson } = require("../utils");

jest.mock("fs");
jest.mock("execa");
jest.mock("../utils");

describe("migrateHusky", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should update huskyrc and package scripts", async () => {
    fs.existsSync.mockReturnValueOnce(true);

    readJson.mockReturnValueOnce({
      scripts: {
        start: "webpack",
      },
    });

    readJson.mockReturnValueOnce({
      hooks: {
        "pre-commit": "lint-staged",
      },
    });

    await migrateHusky();

    expect(writeJsonFile).toBeCalledTimes(2);
    expect(writeJsonFile).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(".huskyrc"),
      {
        hooks: {
          "pre-commit": "npm run lint-staged",
        },
      }
    );
    expect(writeJsonFile).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("package.json"),
      {
        scripts: {
          start: "webpack",
          "lint-staged": "lint-staged",
        },
      }
    );

    expect(execa).toBeCalledTimes(2);
  });

  it("should work when huskyrc not existed", async () => {
    fs.existsSync.mockReturnValueOnce(false);

    readJson.mockReturnValueOnce({
      scripts: {
        start: "webpack",
      },
    });

    await migrateHusky();

    expect(writeJsonFile).toBeCalledTimes(1);
    expect(writeJsonFile).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("package.json"),
      {
        scripts: {
          start: "webpack",
          "lint-staged": "lint-staged",
        },
      }
    );

    expect(execa).toBeCalledTimes(2);
  });

  it("should work when huskyrc is already updated", async () => {
    fs.existsSync.mockReturnValueOnce(true);

    readJson.mockReturnValueOnce({
      scripts: {
        start: "webpack",
      },
    });

    readJson.mockReturnValueOnce({
      hooks: {
        "pre-commit": "npm run lint-staged",
      },
    });

    await migrateHusky();

    expect(writeJsonFile).toBeCalledTimes(1);
    expect(writeJsonFile).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("package.json"),
      {
        scripts: {
          start: "webpack",
          "lint-staged": "lint-staged",
        },
      }
    );

    expect(execa).toBeCalledTimes(2);
  });

  it("should work when lint-staged existed in package scripts", async () => {
    fs.existsSync.mockReturnValueOnce(true);

    readJson.mockReturnValueOnce({
      scripts: {
        start: "webpack",
        "lint-staged": "lint-staged",
      },
    });

    readJson.mockReturnValueOnce({
      hooks: {
        "pre-commit": "lint-staged",
      },
    });

    await migrateHusky();

    expect(writeJsonFile).toBeCalledTimes(1);
    expect(writeJsonFile).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(".huskyrc"),
      {
        hooks: {
          "pre-commit": "npm run lint-staged",
        },
      }
    );

    expect(execa).toBeCalledTimes(2);
  });
});
