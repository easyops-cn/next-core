const { LessReplacer } = require("./LessReplacer");

describe("LessReplacer", () => {
  let replacer;

  beforeEach(() => {
    replacer = new LessReplacer();
  });

  test.each([
    [
      `@table-header-sort-active-bg: fn();
@table-header-filter-active-bg: fn();
@table-header-sort-active-filter-bg: fn();
@pagination-item-disabled-bg-active: fn();`,
      `@table-header-sort-active-bg: var(--antd-table-header-sort-active-bg);
@table-header-filter-active-bg: var(--antd-table-header-filter-active-bg);
@table-header-sort-active-filter-bg: var(--antd-table-header-sort-active-filter-bg);
@pagination-item-disabled-bg-active: var(--antd-pagination-item-disabled-bg-active);`,
    ],
    [
      `@a: fade(@calendar-item-active-bg, 20%);
@b: darken(@item-active-bg, 2%);`,
      `@a: var(--antd-column-active-bg);
@b: var(--antd-item-active-bg-darken-2);`,
    ],
  ])("LessReplacer should work", (source, result) => {
    expect(replacer.process(source)).toBe(result);
  });
});
