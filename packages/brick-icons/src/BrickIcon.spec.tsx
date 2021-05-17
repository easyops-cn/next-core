import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import { BrickIcon } from "./BrickIcon";

jest.mock("./generated/categories", () => ({
  default: jest.fn().mockResolvedValue({
    task() {
      return <span>default:task</span>;
    },
  }),
  app: jest.fn().mockResolvedValue({
    idc() {
      return <span>app:idc</span>;
    },
  }),
}));

describe("BrickIcon", () => {
  it("should render a default icon when category is missed", async () => {
    const wrapper = mount(<BrickIcon icon="task" />);
    await act(async () => {
      await (global as any).flushPromises();
    });
    wrapper.update();
    expect(wrapper.find("task").prop("className")).toBe(
      "easyops-icon easyops-icon-default-task"
    );
  });

  it("should render a default icon when category is an empty string", async () => {
    const wrapper = mount(<BrickIcon icon="task" category="" />);
    await act(async () => {
      await (global as any).flushPromises();
    });
    wrapper.update();
    expect(wrapper.find("task").prop("className")).toBe(
      "easyops-icon easyops-icon-default-task"
    );
  });

  it("should render an app icon", async () => {
    const wrapper = mount(<BrickIcon icon="idc" category="app" />);
    await act(async () => {
      await (global as any).flushPromises();
    });
    wrapper.update();
    expect(wrapper.find("idc").prop("className")).toBe(
      "easyops-icon easyops-icon-app-idc"
    );
  });

  it("should render nothing if category not found", async () => {
    const wrapper = mount(<BrickIcon icon="task" category="not-existed" />);
    await act(async () => {
      await (global as any).flushPromises();
    });
    wrapper.update();
    expect(wrapper.html()).toBe(null);
  });

  it("should render nothing if icon not found", async () => {
    const wrapper = mount(<BrickIcon icon="not-existed" />);
    await act(async () => {
      await (global as any).flushPromises();
    });
    wrapper.update();
    expect(wrapper.html()).toBe(null);
  });
});
