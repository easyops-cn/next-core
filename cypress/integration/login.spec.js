/// <reference types="Cypress" />

describe("Login page", () => {
  it("Redirect to login page and redirect back to home", () => {
    // We test as the real world with `--subdir`.
    cy.visit("/next/");
    cy.location("pathname").should("eq", "/next/auth/login");
    cy.get("#general_login_username").type("easyops");
    cy.get("#general_login_password").type("easyops");
    cy.get('button[type="submit"]').click();
    cy.location("pathname").should("eq", "/next/");
    // Homepage will redirect to `./search` by default settings.
    cy.location("pathname").should("eq", "/next/search");
    cy.get('[class^="searchImage"]');
  });

  it("Redirect to login page and redirect back to previous page which is 404", () => {
    cy.visit("/next/not-existed");
    cy.location("pathname").should("eq", "/next/auth/login");
    cy.get("#general_login_username").type("easyops");
    cy.get("#general_login_password").type("easyops");
    cy.get('button[type="submit"]').click();
    cy.location("pathname").should("eq", "/next/not-existed");
    cy.contains("/next/not-existed");
  });
});
