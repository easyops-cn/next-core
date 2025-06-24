import { deepFreeze } from "./deepFreeze.js";

describe("deepFreeze", () => {
  it("should work", () => {
    const object = {
      string: "yes",
      array: ["a", "b", "c"],
      object: {
        number: 1,
        array: [2, 3, 4],
      },
    };

    const frozen = deepFreeze(object);

    expect(frozen).toBe(object);
    expect(frozen).toEqual({
      string: "yes",
      array: ["a", "b", "c"],
      object: {
        number: 1,
        array: [2, 3, 4],
      },
    });

    expect(() => {
      // Add a new prop.
      (frozen as any).hello = "world";
    }).toThrow();

    expect(() => {
      // Override an existed prop.
      frozen.string = "overridden";
    }).toThrow();

    expect(() => {
      // Delete a prop.
      delete (frozen as Partial<typeof object>).string;
    }).toThrow();

    expect(() => {
      // Push a item to a prop of array.
      frozen.array.push("z");
    }).toThrow();

    expect(() => {
      // Pop a prop of array.
      frozen.array.pop();
    }).toThrow();

    expect(() => {
      // Delete a prop of array.
      delete (frozen as Partial<typeof object>).array;
    }).toThrow();

    expect(() => {
      // Override a nested object's prop.
      frozen.object.number = 2;
    }).toThrow();

    expect(() => {
      // Override a nested object's prop.
      frozen.object.array.push(9);
    }).toThrow();
  });
});
