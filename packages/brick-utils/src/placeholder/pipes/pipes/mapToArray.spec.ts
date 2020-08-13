import { mapToArray } from "./mapToArray";

describe("mapToArray", () => {
  const testCases: [
    Parameters<typeof mapToArray>,
    ReturnType<typeof mapToArray>
  ][] = [
    [[null, "", ""], []],
    [["23", "", ""], []],
    [
      [{ HOST: "主机", APP: "应用" }, "id", "label"],
      [
        { id: "HOST", label: "主机" },
        { id: "APP", label: "应用" },
      ],
    ],
  ];
  test.each(testCases)(
    "mapToArray(...%j) should return %j",
    (input, output) => {
      expect(mapToArray(...input)).toEqual(output);
    }
  );
});
