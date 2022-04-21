import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { $PascalBrickName$ } from "./$PascalBrickName$";

describe("$PascalBrickName$", () => {
  it("should work", () => {
    render(<$PascalBrickName$ />);
    fireEvent.click(screen.getByTestId("my-brick"));
    expect(screen.getByTestId("my-brick")).toHaveTextContent(
      "$CONSTANT_PACKAGE_NAME$ works!"
    );
  });
});
