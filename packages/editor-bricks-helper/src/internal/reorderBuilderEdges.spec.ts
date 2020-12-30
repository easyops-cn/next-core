import { reorderBuilderEdges } from "./reorderBuilderEdges";

describe("reorderBuilderEdges", () => {
  it("should work", () => {
    expect(
      reorderBuilderEdges(
        [
          {
            parent: 1,
            child: 2,
            mountPoint: "toolbar",
            sort: 0,
          },
          {
            parent: 1,
            child: 3,
            mountPoint: "toolbar",
            sort: 1,
          },
          {
            parent: 1,
            child: 4,
            mountPoint: "content",
            sort: 0,
          },
        ],
        1,
        [3, 2, 4]
      )
    ).toEqual([
      {
        parent: 1,
        child: 2,
        mountPoint: "toolbar",
        sort: 1,
      },
      {
        parent: 1,
        child: 3,
        mountPoint: "toolbar",
        sort: 0,
      },
      {
        parent: 1,
        child: 4,
        mountPoint: "content",
        sort: 2,
      },
    ]);
  });
});
