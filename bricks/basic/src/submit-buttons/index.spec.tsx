import React from "react";
import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.jsx";
import { SubmitButtons, ButtonsComponent } from "./index.jsx";
import { render, fireEvent } from "@testing-library/react";

describe("basic.submit-buttons", () => {
  test("basic usage", () => {
    const element = document.createElement(
      "basic.submit-buttons"
    ) as SubmitButtons;
    expect(element.shadowRoot).toBeFalsy();
    act(() => {
      document.body.appendChild(element);
      element.submitText = "提交";
      element.showCancelButton = true;
      (element.cancelText = "取消"), (element.disableAfterClick = true);
    });

    expect(element.shadowRoot).toBeTruthy();
    expect(element.shadowRoot?.childNodes.length).toBe(2);
    const submitMockFn = jest.fn();
    const cancelMockFn = jest.fn();
    const { container } = render(
      <ButtonsComponent
        submitText="提交"
        showCancelButton={true}
        curElement={{} as any}
        onSubmitClick={submitMockFn}
        onCancelClick={cancelMockFn}
        cancelText="取消"
        submitDisabled={true}
      />
    );
    expect(container.querySelector("[data-test-id=cancelBtn]")).toBeTruthy();
    expect(container.querySelector(".submitBtn")).toBeTruthy();
    act(() => {
      document.body.removeChild(element);
    });
    expect(element.shadowRoot?.childNodes.length).toBe(0);
  });
});
