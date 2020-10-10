import { deepFreeze } from "./deepFreeze";

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
    }).toThrowError();

    expect(() => {
      // Override an existed prop.
      frozen.string = "overridden";
    }).toThrowError();

    expect(() => {
      // Delete a prop.
      delete frozen.string;
    }).toThrowError();

    expect(() => {
      // Push a item to a prop of array.
      frozen.array.push("z");
    }).toThrowError();

    expect(() => {
      // Pop a prop of array.
      frozen.array.pop();
    }).toThrowError();

    expect(() => {
      // Delete a prop of array.
      delete frozen.array;
    }).toThrowError();

    expect(() => {
      // Override a nested object's prop.
      frozen.object.number = 2;
    }).toThrowError();

    expect(() => {
      // Override a nested object's prop.
      frozen.object.array.push(9);
    }).toThrowError();
  });
});
