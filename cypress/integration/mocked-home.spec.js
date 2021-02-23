/// <reference types="Cypress" />

describe("Mocked homepage", () => {
  beforeEach(() => {
    cy.login();
    cy.intercept("GET", "/next/api/gateway/testService/testApiTwo", {
      statusCode: 200,
      body: {
        quality: "good",
      },
    }).as("testApiTwo");
  });

  it("work", () => {
    cy.visit("/next/", {
      onBeforeLoad(win) {
        cy.spy(win.console, "error").as("console.error");
      },
    });
    cy.get("basic-bricks\\.micro-view");
    cy.get("basic-bricks\\.general-button");
    cy.get("basic-bricks\\.page-error").should("not.exist");
    cy.get("@console.error").should("not.be.called");
    cy.get("pre").invoke("text").should("eq", '"good"');
  });
});
