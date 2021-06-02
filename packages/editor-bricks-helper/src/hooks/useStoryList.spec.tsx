import React from "react";
import { mount } from "enzyme";
import { useStoryList } from "./useStoryList";
import { useBuilderDataManager } from "./useBuilderDataManager";
import { StoryDoc } from "@next-core/brick-types";

jest.mock("./useBuilderDataManager");

(useBuilderDataManager as jest.Mock).mockReturnValue({
  getStoryList: jest.fn().mockReturnValue([
    {
      category: "card",
      storyId: "basic-bricks.general-card",
      text: {
        en: "general-card",
        zh: "卡片",
      },
      doc: {
        editor: "base-card--editor",
      },
    },
  ]),
});

function TestComponent(): React.ReactElement {
  const data = useStoryList();
  return (
    <>
      {data.map((item) => (
        <div key={item.storyId}>editor:{(item.doc as StoryDoc).editor}</div>
      ))}
    </>
  );
}

describe("useStoryList", () => {
  it("should work", () => {
    const wrapper = mount(<TestComponent />);
    expect(wrapper.text()).toEqual(
      expect.stringContaining("base-card--editor")
    );
  });
});
