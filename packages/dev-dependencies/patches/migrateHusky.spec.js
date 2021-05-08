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
      hooks: {
        "pre-commit": "lint-staged",
      },
    });

    const rootPackageJson = {
      scripts: {
        start: "webpack",
      },
    };

    await migrateHusky(rootPackageJson);

    expect(writeJsonFile).toBeCalledWith(expect.stringContaining(".huskyrc"), {
      hooks: {
        "pre-commit": "npm run lint-staged",
      },
    });

    expect(rootPackageJson).toEqual({
      scripts: {
        start: "webpack",
        "lint-staged": "lint-staged",
      },
    });

    expect(execa).toBeCalledTimes(2);
  });

  it("should work when huskyrc not existed", async () => {
    fs.existsSync.mockReturnValueOnce(false);

    const rootPackageJson = {
      scripts: {
        start: "webpack",
      },
    };

    await migrateHusky(rootPackageJson);

    expect(writeJsonFile).not.toBeCalled();

    expect(rootPackageJson).toEqual({
      scripts: {
        start: "webpack",
        "lint-staged": "lint-staged",
      },
    });

    expect(execa).toBeCalledTimes(2);
  });

  it("should work when huskyrc is already updated", async () => {
    fs.existsSync.mockReturnValueOnce(true);

    readJson.mockReturnValueOnce({
      hooks: {
        "pre-commit": "npm run lint-staged",
      },
    });

    const rootPackageJson = {
      scripts: {
        start: "webpack",
      },
    };

    await migrateHusky(rootPackageJson);

    expect(writeJsonFile).not.toBeCalled();

    expect(rootPackageJson).toEqual({
      scripts: {
        start: "webpack",
        "lint-staged": "lint-staged",
      },
    });

    expect(execa).toBeCalledTimes(2);
  });

  it("should work when lint-staged existed in package scripts", async () => {
    fs.existsSync.mockReturnValueOnce(true);

    readJson.mockReturnValueOnce({
      hooks: {
        "pre-commit": "lint-staged",
      },
    });

    const rootPackageJson = Object.freeze({
      scripts: Object.freeze({
        start: "webpack",
        "lint-staged": "lint-staged",
      }),
    });

    await migrateHusky(rootPackageJson);

    expect(writeJsonFile).toBeCalledWith(expect.stringContaining(".huskyrc"), {
      hooks: {
        "pre-commit": "npm run lint-staged",
      },
    });

    expect(execa).toBeCalledTimes(2);
  });
});
