/// <reference types="Cypress" />

describe("Mocked homepage", () => {
  beforeEach(() => {
    cy.login();
  });

  it("work", () => {
    cy.visit("/next/", {
      onBeforeLoad(win) {
        cy.spy(win.console, "error").as("console.error");
      },
    });
    cy.get("basic-bricks\\.micro-view", {
      timeout: 20e3,
    });
    cy.get("basic-bricks\\.general-button");
    cy.get("basic-bricks\\.page-error").should("not.exist");
    cy.get("@console.error").should("not.be.called");
  });
});
