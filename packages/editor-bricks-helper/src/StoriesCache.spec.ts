const mockGetStoriesJSONRequset = jest.fn((args = {}) => {
  if (Array.isArray(args.storyIds) && args.storyIds.length > 0) {
    const list = args.storyIds.map((item: string) => ({
      examples: [
        {
          properties: "test-props",
        },
      ],
      ...(item === "brick-a"
        ? {
            id: "brick-a",
          }
        : {
            storyId: "brick-b",
          }),
    }));
    return {
      data: {
        list: list,
      },
    };
  } else {
    return {
      data: {
        list: [
          {
            id: "brick-a",
            examples: null,
            text: "a",
          },
          {
            storyId: "brick-b",
            examples: null,
            text: "b",
          },
        ],
      },
    };
  }
});

jest.mock("@next-sdk/next-builder-sdk", () => ({
  BuildApi_getStoriesJson: mockGetStoriesJSONRequset,
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { StoriesCache, installInfo } = require("./StoriesCache");

const instance = StoriesCache.getInstance();

describe("StoriesCache", () => {
  it("getInstance result should be equal", () => {
    const instance1 = StoriesCache.getInstance();
    expect(instance).toBe(instance1);
  });

  it("install and getStoryList should work", async () => {
    expect(mockGetStoriesJSONRequset).toBeCalledTimes(0);
    await instance.install({
      fields: ["id", "text"],
    });
    expect(mockGetStoriesJSONRequset).toBeCalledTimes(1);
    expect(instance.getStoryList()).toEqual([
      {
        id: "brick-a",
        examples: null,
        text: "a",
      },
      {
        storyId: "brick-b",
        examples: null,
        text: "b",
      },
    ]);
    expect([...instance.cache.installed]).toEqual([]);
    await instance.install(
      {
        list: ["brick-a"],
        fields: ["id", "examples"],
      },
      true
    );
    expect(mockGetStoriesJSONRequset).toBeCalledTimes(2);
    expect(instance.getStoryList()).toEqual([
      {
        id: "brick-a",
        examples: [
          {
            properties: "test-props",
          },
        ],
        text: "a",
      },
      {
        storyId: "brick-b",
        examples: null,
        text: "b",
      },
    ]);
    expect([...instance.cache.installed]).toEqual(["brick-a"]);

    // install brick-a again without request again
    await instance.install(
      {
        list: ["brick-a"],
        fields: ["id", "examples"],
      },
      true
    );
    expect(mockGetStoriesJSONRequset).toBeCalledTimes(2);

    await instance.install(
      {
        list: ["brick-a", "brick-b"],
        fields: ["id", "examples"],
      },
      true
    );
    expect(mockGetStoriesJSONRequset).toBeCalledTimes(3);
    expect(mockGetStoriesJSONRequset.mock.calls).toEqual([
      [{ fields: ["id", "text"], storyIds: [] }],
      [{ fields: ["id", "examples"], storyIds: ["brick-a"] }],
      [{ fields: ["id", "examples"], storyIds: ["brick-b"] }],
    ]);
    expect(instance.getStoryList()).toEqual([
      {
        id: "brick-a",
        examples: [
          {
            properties: "test-props",
          },
        ],
        text: "a",
      },
      {
        storyId: "brick-b",
        examples: [
          {
            properties: "test-props",
          },
        ],
        text: "b",
      },
    ]);
    expect([...instance.cache.installed]).toEqual(["brick-a", "brick-b"]);

    // use cache
    await instance.install(
      {
        list: ["brick-a", "brick-b"],
        fields: ["id", "examples"],
      },
      true
    );
    expect(mockGetStoriesJSONRequset).toBeCalledTimes(3);

    // install base info and we don't request again
    await instance.install({
      list: [],
      fields: ["*"],
    });
    expect(mockGetStoriesJSONRequset).toBeCalledTimes(3);
  });

  it("hasInstalled should work", () => {
    expect(instance.hasInstalled("brick-a")).toBeTruthy();
    expect(instance.hasInstalled("brick-b")).toBeTruthy();
    expect(instance.hasInstalled("brick-c")).toBeFalsy();
  });

  it("init should work", () => {
    const initData: any = [
      {
        id: "brick-c",
        examples: null,
        text: "a",
      },
      {
        storyId: "brick-d",
        examples: null,
        text: "a",
      },
    ];
    instance.init(initData);
    const result = [
      {
        id: "brick-a",
        examples: [
          {
            properties: "test-props",
          },
        ],
        text: "a",
      },
      {
        storyId: "brick-b",
        examples: [
          {
            properties: "test-props",
          },
        ],
        text: "b",
      },
    ].concat(initData);
    expect(instance.getStoryList()).toEqual(result);
    expect([...instance.cache.installed]).toEqual(["brick-a", "brick-b"]);
  });
});
