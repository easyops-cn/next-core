import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.jsx";
import type { TabList } from "./index.jsx";

jest.mock("@next-core/theme", () => ({}));

describe("containers.tab-list", () => {
  test("basic usage", async () => {
    const element = document.createElement("containers.tab-list") as TabList;
    element.tabs = [
      "新增",
      {
        text: "编辑",
        panel: "编辑",
      },
      "删除",
    ];

    element.activePanel = "编辑";

    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
    });
    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(1);

    expect(element.shadowRoot.innerHTML).toMatchInlineSnapshot(
      `"<containers.tab-group activepanel="编辑"><containers.tab-item slot="nav" text="新增" panel="新增">新增</containers.tab-item><containers.tab-item slot="nav" active="" text="编辑" panel="编辑">编辑</containers.tab-item><containers.tab-item slot="nav" text="删除" panel="删除">删除</containers.tab-item><slot name="extra" slot="extra"></slot><slot name="新增" slot="新增"></slot><slot name="编辑" slot="编辑"></slot><slot name="删除" slot="删除"></slot></containers.tab-group>"`
    );

    act(() => {
      document.body.removeChild(element);
    });

    expect(document.body.contains(element)).toBeFalsy();
  });
});
