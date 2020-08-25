/// <reference types="Cypress" />

describe("Developers page", () => {
  beforeEach(() => {
    cy.login();
  });

  it("work", () => {
    cy.visit("/next/developers/brick-book/brick/graph.general-graph", {
      onBeforeLoad(win) {
        cy.spy(win.console, "error").as("console.error");
      },
    });
    cy.get("basic-bricks\\.micro-view", {
      timeout: 10e3,
    });
    cy.contains("graph.general-graph");
    cy.get("graph\\.general-graph");
    cy.get("basic-bricks\\.page-error").should("not.exist");
    cy.get("@console.error").should("not.be.called");
  });
});
