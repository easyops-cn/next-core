import { getUrlByImageFactory } from "./image";

describe("getUrlByImageFactory", () => {
  const images = [
    {
      name: "a.jpg",
      url: "api/gateway/object_store.object_store.GetObject/a.jpg",
    },
    {
      name: "b.jpg",
      url: "api/gateway/object_store.object_store.GetObject/b.jpg",
    },
    {
      name: "c.jpg",
      url: "api/gateway/object_store.object_store.GetObject/c.jpg",
    },
    {
      name: "d.jpg",
      url: "api/gateway/object_store.object_store.GetObject/d.jpg",
    },
  ];

  it.each([
    [images, "a.jpg", "api/gateway/object_store.object_store.GetObject/a.jpg"],
    [images, "b.jpg", "api/gateway/object_store.object_store.GetObject/b.jpg"],
    [images, "d.jpg", "api/gateway/object_store.object_store.GetObject/d.jpg"],
  ])("getUrlByImageFactory(...)(%s) should return %s", (images, name, url) => {
    expect(getUrlByImageFactory(images)(name)).toEqual(url);
  });

  it("should printf log if no images upload", () => {
    const images = [] as any;
    const consoleSpy = jest.spyOn(console, "warn");

    getUrlByImageFactory(images)("1.jpg");
    expect(consoleSpy.mock.calls[0][0]).toEqual(
      "no images uploaded, please upload image first"
    );
  });

  it("should not found image if the name is invalid", () => {
    const images = [
      {
        name: "1.jpg",
        url: "api/gateway/object_store.object_store.GetObject/1.jpg",
      },
    ];

    const consoleSpy = jest.spyOn(console, "warn");
    getUrlByImageFactory(images)("xxx.jpg");
    expect(consoleSpy.mock.calls[1][0]).toEqual(
      "the name of the image was not found:"
    );
  });
});
