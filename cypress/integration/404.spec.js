/// <reference types="Cypress" />

describe("404 page", () => {
  beforeEach(() => {
    cy.login();
  });

  it("show page not found", () => {
    cy.visit("/next/not-existed");
    cy.contains("basic-bricks\\.page-not-found", "/next/not-existed");
  });
});
