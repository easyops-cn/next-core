/// <reference types="Cypress" />

describe("Login page", () => {
  beforeEach(() => {
    cy.logout();
  });

  it("redirect to login page", () => {
    // We test as the real world with `--subdir`.
    cy.visit("/next/home/?lng=zh");
    cy.location("pathname").should("eq", "/next/auth/login");
  });
});
