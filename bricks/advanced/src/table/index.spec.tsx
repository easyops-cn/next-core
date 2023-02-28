import React from "react";
import { describe, test, expect } from "@jest/globals";
import { act } from "react-dom/test-utils";
import "./index.jsx";
import { TableComponent } from "./index.jsx";

jest.mock("./BrickTable.js", () => <div>hello world</div>);
jest.mock("@next-core/theme", () => ({}));

describe("advanced.general-table", () => {
  test("basic usage", () => {
    const element = document.createElement(
      "advanced.general-table"
    ) as TableComponent;

    expect(element.shadowRoot).toBeFalsy();
    document.body.appendChild(element);
    expect(element.shadowRoot).toBeTruthy();
  });
});
